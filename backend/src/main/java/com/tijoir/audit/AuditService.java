package com.tijoir.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.audit.dto.AuditReportResponse;
import com.tijoir.audit.dto.AuditEventResponse;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageRequestFactory;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.organization.OrganizationAuthorizationService;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {
    private final AuditEventRepository auditEventRepository;
    private final OrganizationAuthorizationService authorizationService;
    private final ObjectMapper objectMapper;

    public AuditService(
            AuditEventRepository auditEventRepository,
            OrganizationAuthorizationService authorizationService,
            ObjectMapper objectMapper
    ) {
        this.auditEventRepository = auditEventRepository;
        this.authorizationService = authorizationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditEventResponse> list(
            AuthenticatedUser principal,
            Integer page,
            Integer size,
            String query,
            AuditAction action,
            String resourceType
    ) {
        authorizationService.requireAuditReader(principal.role());
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditEventResponse> results = auditEventRepository.findAll(
                        auditSpec(principal.organizationId(), query, action, resourceType),
                        pageRequest
                )
                .map(this::toResponse);
        return PageResponse.from(results);
    }

    @Transactional(readOnly = true)
    public AuditReportResponse report(
            AuthenticatedUser principal,
            String query,
            AuditAction action,
            String resourceType
    ) {
        authorizationService.requireAuditReader(principal.role());
        List<AuditEvent> events = auditEventRepository.findAll(auditSpec(principal.organizationId(), query, action, resourceType));
        Instant cutoff = Instant.now().minusSeconds(24 * 60 * 60);
        Map<String, Long> byAction = new LinkedHashMap<>();
        Map<String, Long> byResourceType = new LinkedHashMap<>();
        long last24h = 0;

        for (AuditEvent event : events) {
            byAction.merge(event.getAction().name(), 1L, Long::sum);
            byResourceType.merge(event.getResourceType(), 1L, Long::sum);
            if (event.getCreatedAt().isAfter(cutoff)) {
                last24h++;
            }
        }

        return new AuditReportResponse(
                events.size(),
                last24h,
                byAction,
                byResourceType
        );
    }

    @Transactional(readOnly = true)
    public String exportCsv(
            AuthenticatedUser principal,
            String query,
            AuditAction action,
            String resourceType
    ) {
        authorizationService.requireAuditReader(principal.role());
        List<AuditEvent> events = auditEventRepository.findAll(
                auditSpec(principal.organizationId(), query, action, resourceType),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        StringBuilder builder = new StringBuilder();
        builder.append("id,createdAt,action,resourceType,resourceId,actorUserId,actorName,actorEmail,detailsJson\n");
        for (AuditEvent event : events) {
            builder.append(csv(event.getId()))
                    .append(',')
                    .append(csv(event.getCreatedAt()))
                    .append(',')
                    .append(csv(event.getAction().name()))
                    .append(',')
                    .append(csv(event.getResourceType()))
                    .append(',')
                    .append(csv(event.getResourceId()))
                    .append(',')
                    .append(csv(event.getActor() != null ? event.getActor().getId() : null))
                    .append(',')
                    .append(csv(event.getActor() != null ? event.getActor().getName() : null))
                    .append(',')
                    .append(csv(event.getActor() != null ? event.getActor().getEmail() : null))
                    .append(',')
                    .append(csv(event.getDetailsJson()))
                    .append('\n');
        }
        return builder.toString();
    }

    private AuditEventResponse toResponse(AuditEvent event) {
        return new AuditEventResponse(
                event.getId(),
                event.getAction(),
                event.getResourceType(),
                event.getResourceId(),
                event.getActor() != null ? event.getActor().getId() : null,
                event.getActor() != null ? event.getActor().getName() : null,
                event.getActor() != null ? event.getActor().getEmail() : null,
                parseDetails(event.getDetailsJson()),
                event.getCreatedAt()
        );
    }

    private JsonNode parseDetails(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception ex) {
            return objectMapper.getNodeFactory().textNode(raw);
        }
    }

    private String csv(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    private Specification<AuditEvent> auditSpec(
            UUID organizationId,
            String query,
            AuditAction action,
            String resourceType
    ) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.equal(root.get("organization").get("id"), organizationId);

            if (action != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("action"), action));
            }
            if (resourceType != null && !resourceType.isBlank()) {
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.equal(root.get("resourceType"), resourceType.trim().toUpperCase(Locale.ROOT))
                );
            }
            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                var actorJoin = root.join("actor", JoinType.LEFT);
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("resourceType")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("action").as(String.class)), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(actorJoin.get("name"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(actorJoin.get("email"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("detailsJson"), "")), pattern)
                ));
            }

            return predicate;
        };
    }
}
