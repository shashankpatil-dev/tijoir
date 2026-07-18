package com.tijoir.sharelink.dto;

import com.tijoir.contract.ContractPermission;
import com.tijoir.secret.SecretType;
import com.tijoir.sharelink.ShareLinkStatus;

import java.util.UUID;

public record ConsumeShareLinkResponse(
        UUID shareLinkId,
        String secretName,
        String secretKey,
        SecretType secretType,
        int versionNumber,
        String value,
        ContractPermission permission,
        ShareLinkStatus status,
        com.tijoir.sharelink.PublicShareSourceType sourceType
) {
}
