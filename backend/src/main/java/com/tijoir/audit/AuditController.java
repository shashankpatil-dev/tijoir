package com.tijoir.audit;

import com.tijoir.audit.dto.AuditEventResponse;
import com.tijoir.audit.dto.AuditReportResponse;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-events")
public class AuditController {
    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public PageResponse<AuditEventResponse> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String resourceType
    ) {
        return auditService.list(user, page, size, query, action, resourceType);
    }

    @GetMapping("/report")
    public AuditReportResponse report(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String resourceType
    ) {
        return auditService.report(user, query, action, resourceType);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> export(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String resourceType
    ) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .cacheControl(CacheControl.noStore())
                .body(auditService.exportCsv(user, query, action, resourceType));
    }
}
