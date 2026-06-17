package com.tijoir.connection;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.connection.dto.CreateVendorContractRequest;
import com.tijoir.connection.dto.CreateVendorRequest;
import com.tijoir.connection.dto.OffboardVendorResponse;
import com.tijoir.connection.dto.VendorContractResponse;
import com.tijoir.connection.dto.VendorResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {
    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping
    public PageResponse<VendorResponse> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String query,
            @org.springframework.web.bind.annotation.RequestParam(required = false) VendorStatus status
    ) {
        return vendorService.list(user, page, size, query, status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VendorResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateVendorRequest request
    ) {
        return vendorService.create(user, request);
    }

    @GetMapping("/{vendorId}")
    public VendorResponse get(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID vendorId
    ) {
        return vendorService.get(user, vendorId);
    }

    @GetMapping("/{vendorId}/contracts")
    public PageResponse<VendorContractResponse> listContracts(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID vendorId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) VendorAccessContractStatus status
    ) {
        return vendorService.listContracts(user, vendorId, page, size, status);
    }

    @PostMapping("/{vendorId}/contracts")
    @ResponseStatus(HttpStatus.CREATED)
    public VendorContractResponse createContract(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID vendorId,
            @Valid @RequestBody CreateVendorContractRequest request
    ) {
        return vendorService.createContract(user, vendorId, request);
    }

    @PostMapping("/{vendorId}/contracts/{contractId}/revoke")
    public VendorContractResponse revokeContract(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID vendorId,
            @PathVariable UUID contractId
    ) {
        return vendorService.revokeContract(user, vendorId, contractId);
    }

    @PostMapping("/{vendorId}/offboard")
    public OffboardVendorResponse offboard(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID vendorId
    ) {
        return vendorService.offboard(user, vendorId);
    }
}
