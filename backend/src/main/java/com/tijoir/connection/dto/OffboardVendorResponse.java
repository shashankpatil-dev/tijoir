package com.tijoir.connection.dto;

import java.util.UUID;

public record OffboardVendorResponse(
        UUID vendorId,
        String vendorName,
        int revokedContracts,
        int revokedShareLinks,
        boolean offboarded
) {
}
