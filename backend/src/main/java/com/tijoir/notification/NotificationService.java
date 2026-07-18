package com.tijoir.notification;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.paging.PageRequestFactory;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.notification.email.EmailMessage;
import com.tijoir.notification.email.EmailSender;
import com.tijoir.notification.email.EmailTemplateFactory;
import com.tijoir.notification.dto.NotificationResponse;
import com.tijoir.organization.OrganizationInvite;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.organization.UserRole;
import com.tijoir.organization.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRecordRepository notificationRecordRepository;
    private final NotificationProperties notificationProperties;
    private final NotificationLinkFactory notificationLinkFactory;
    private final EmailTemplateFactory emailTemplateFactory;
    private final EmailSender emailSender;
    private final UserAccountRepository userAccountRepository;

    public NotificationService(
            NotificationRecordRepository notificationRecordRepository,
            NotificationProperties notificationProperties,
            NotificationLinkFactory notificationLinkFactory,
            EmailTemplateFactory emailTemplateFactory,
            EmailSender emailSender,
            UserAccountRepository userAccountRepository
    ) {
        this.notificationRecordRepository = notificationRecordRepository;
        this.notificationProperties = notificationProperties;
        this.notificationLinkFactory = notificationLinkFactory;
        this.emailTemplateFactory = emailTemplateFactory;
        this.emailSender = emailSender;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(AuthenticatedUser principal, Integer page, Integer size) {
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NotificationResponse> results = notificationRecordRepository.findByUserIdOrderByCreatedAtDesc(principal.userId(), pageRequest)
                .map(this::toResponse);
        return PageResponse.from(results);
    }

    @Transactional
    public NotificationResponse markRead(AuthenticatedUser principal, UUID notificationId) {
        NotificationRecord record = notificationRecordRepository.findByIdAndUserId(notificationId, principal.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        record.markRead();
        return toResponse(record);
    }

    @Transactional
    public void recordVerificationRequested(UserAccount user, String rawToken, Instant expiresAt, boolean resend) {
        if (!notificationProperties.isEnabled()) {
            return;
        }

        NotificationType type = resend ? NotificationType.EMAIL_VERIFICATION_RESEND : NotificationType.EMAIL_VERIFICATION;
        String actionUrl = notificationLinkFactory.verificationLink(rawToken, user.getEmail());
        boolean shouldSendEmail = notificationProperties.getEmail().isEnabled()
                && notificationProperties.getEmail().getVerification().isEnabled();

        NotificationRecord record = notificationRecordRepository.save(new NotificationRecord(
                user.getOrganization(),
                user,
                null,
                type,
                resend ? "Verification email resent" : "Verification email prepared",
                resend
                        ? "A fresh verification link was issued for %s.".formatted(user.getEmail())
                        : "A verification link was issued for %s.".formatted(user.getEmail()),
                actionUrl,
                user.getEmail(),
                shouldSendEmail ? NotificationEmailDeliveryStatus.NOT_REQUESTED : NotificationEmailDeliveryStatus.SKIPPED
        ));

        if (!shouldSendEmail) {
            record.markSkipped();
            return;
        }

        EmailMessage message = emailTemplateFactory.verificationMessage(
                user.getEmail(),
                user.getName(),
                user.getOrganization().getName(),
                actionUrl,
                expiresAt,
                resend
        );
        applyDeliveryResult(record, emailSender.send(message));
    }

    @Transactional
    public void recordInviteCreated(UserAccount actor, OrganizationInvite invite, String rawToken) {
        recordInviteDelivery(actor, invite, rawToken, false);
    }

    @Transactional
    public void recordInviteResent(UserAccount actor, OrganizationInvite invite, String rawToken) {
        recordInviteDelivery(actor, invite, rawToken, true);
    }

    @Transactional(readOnly = true)
    public NotificationEmailDeliveryStatus latestInviteDeliveryStatus(UUID inviteId) {
        return latestInviteDelivery(inviteId).status();
    }

    @Transactional(readOnly = true)
    public NotificationDeliverySnapshot latestInviteDelivery(UUID inviteId) {
        return notificationRecordRepository.findTopByOrganizationInviteIdOrderByCreatedAtDesc(inviteId)
                .map(this::toDeliverySnapshot)
                .orElse(NotificationDeliverySnapshot.notRequested());
    }

    @Transactional(readOnly = true)
    public NotificationDeliverySnapshot latestVerificationDelivery(UUID userId) {
        return notificationRecordRepository.findTopByUserIdAndTypeInOrderByCreatedAtDesc(
                        userId,
                        List.of(NotificationType.EMAIL_VERIFICATION, NotificationType.EMAIL_VERIFICATION_RESEND)
                )
                .map(this::toDeliverySnapshot)
                .orElse(NotificationDeliverySnapshot.notRequested());
    }

    private void recordInviteDelivery(UserAccount actor, OrganizationInvite invite, String rawToken, boolean resend) {
        if (!notificationProperties.isEnabled()) {
            return;
        }

        String actionUrl = notificationLinkFactory.inviteLink(rawToken);
        boolean shouldSendEmail = notificationProperties.getEmail().isEnabled()
                && notificationProperties.getEmail().getInvites().isEnabled();

        NotificationRecord record = notificationRecordRepository.save(new NotificationRecord(
                actor.getOrganization(),
                actor,
                invite,
                NotificationType.ORGANIZATION_INVITE,
                resend ? "Organization invite resent" : "Organization invite created",
                resend
                        ? "A fresh organization invite was issued for %s.".formatted(invite.getEmail())
                        : "An organization invite was issued for %s.".formatted(invite.getEmail()),
                actionUrl,
                invite.getEmail(),
                shouldSendEmail ? NotificationEmailDeliveryStatus.NOT_REQUESTED : NotificationEmailDeliveryStatus.SKIPPED
        ));

        if (!shouldSendEmail) {
            record.markSkipped();
            return;
        }

        EmailMessage message = emailTemplateFactory.inviteMessage(
                invite.getEmail(),
                actor.getOrganization().getName(),
                actionUrl,
                invite.getExpiresAt()
        );
        applyDeliveryResult(record, emailSender.send(message));
    }

    @Transactional
    public void recordPasswordResetRequested(UserAccount user, String rawToken, Instant expiresAt) {
        if (!notificationProperties.isEnabled()) {
            return;
        }

        String actionUrl = notificationLinkFactory.passwordResetLink(rawToken);
        boolean shouldSendEmail = notificationProperties.getEmail().isEnabled();

        NotificationRecord record = notificationRecordRepository.save(new NotificationRecord(
                user.getOrganization(),
                user,
                null,
                NotificationType.PASSWORD_RESET,
                "Password reset requested",
                "A password reset link was issued for %s.".formatted(user.getEmail()),
                actionUrl,
                user.getEmail(),
                shouldSendEmail ? NotificationEmailDeliveryStatus.NOT_REQUESTED : NotificationEmailDeliveryStatus.SKIPPED
        ));

        if (!shouldSendEmail) {
            record.markSkipped();
            return;
        }

        EmailMessage message = emailTemplateFactory.passwordResetMessage(
                user.getEmail(),
                user.getName(),
                actionUrl,
                expiresAt
        );
        applyDeliveryResult(record, emailSender.send(message));
    }

    @Transactional
    public void recordIncomingVendorContractProposed(
            UserAccount recipient,
            String ownerOrganizationName,
            String vendorName
    ) {
        recordInAppNotification(
                recipient,
                NotificationType.VENDOR_CONTRACT_PROPOSED,
                "Vendor contract proposal received",
                "%s proposed a vendor contract for %s that now awaits counterparty review."
                        .formatted(ownerOrganizationName, vendorName),
                notificationLinkFactory.dashboardVendorsLink()
        );
    }

    @Transactional
    public void recordVendorContractAccepted(
            UserAccount recipient,
            String counterpartyOrganizationName,
            String vendorName
    ) {
        recordInAppNotification(
                recipient,
                NotificationType.VENDOR_CONTRACT_ACCEPTED,
                "Vendor contract accepted",
                "%s accepted the vendor contract for %s. Grants and vendor delivery can now proceed."
                        .formatted(counterpartyOrganizationName, vendorName),
                notificationLinkFactory.dashboardVendorsLink()
        );
    }

    @Transactional
    public void recordVendorContractRejected(
            UserAccount recipient,
            String counterpartyOrganizationName,
            String vendorName
    ) {
        recordInAppNotification(
                recipient,
                NotificationType.VENDOR_CONTRACT_REJECTED,
                "Vendor contract rejected",
                "%s rejected the vendor contract proposal for %s."
                        .formatted(counterpartyOrganizationName, vendorName),
                notificationLinkFactory.dashboardVendorsLink()
        );
    }

    @Transactional(readOnly = true)
    public java.util.List<UserAccount> listVendorManagersForOrganization(java.util.UUID organizationId) {
        return userAccountRepository.findAllByOrganizationIdAndDeactivatedAtIsNullOrderByCreatedAtAsc(organizationId).stream()
                .filter(user -> user.getRole() == UserRole.ORG_OWNER
                        || user.getRole() == UserRole.ADMIN
                        || user.getRole() == UserRole.MEMBER)
                .toList();
    }

    private NotificationResponse toResponse(NotificationRecord record) {
        return new NotificationResponse(
                record.getId(),
                record.getType(),
                record.getTitle(),
                record.getMessage(),
                record.getActionUrl(),
                record.getRecipientEmail(),
                record.getEmailDeliveryStatus(),
                record.getReadAt(),
                record.getDeliveredAt(),
                record.getLastError(),
                record.getCreatedAt()
        );
    }

    private NotificationDeliverySnapshot toDeliverySnapshot(NotificationRecord record) {
        return new NotificationDeliverySnapshot(
                record.getEmailDeliveryStatus(),
                record.getDeliveredAt(),
                record.getLastError()
        );
    }

    private void applyDeliveryResult(NotificationRecord record, EmailSender.DeliveryResult result) {
        if (result.delivered()) {
            record.markDelivered();
            return;
        }
        if (result.skipped()) {
            record.markSkipped();
            return;
        }
        record.markFailed(result.error());
    }

    private void recordInAppNotification(
            UserAccount recipient,
            NotificationType type,
            String title,
            String message,
            String actionUrl
    ) {
        if (!notificationProperties.isEnabled()) {
            return;
        }

        NotificationRecord record = notificationRecordRepository.save(new NotificationRecord(
                recipient.getOrganization(),
                recipient,
                null,
                type,
                title,
                message,
                actionUrl,
                recipient.getEmail(),
                NotificationEmailDeliveryStatus.SKIPPED
        ));
        record.markSkipped();
    }
}
