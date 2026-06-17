package com.tijoir.sharelink;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShareLinkRepository extends JpaRepository<ShareLink, UUID>, JpaSpecificationExecutor<ShareLink> {
    List<ShareLink> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<ShareLink> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<ShareLink> findByTokenHash(String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select shareLink from ShareLink shareLink where shareLink.tokenHash = :tokenHash")
    Optional<ShareLink> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Query("select shareLink from ShareLink shareLink where shareLink.vendor.id = :vendorId and shareLink.status in :statuses")
    List<ShareLink> findAllActiveByVendorId(@Param("vendorId") UUID vendorId, @Param("statuses") List<ShareLinkStatus> statuses);
}
