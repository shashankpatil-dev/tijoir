package com.tijoir.connection;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.connection.dto.CreateVendorContractRequest;
import com.tijoir.connection.dto.CreateVendorContractGrantRequest;
import com.tijoir.connection.dto.CreateVendorRequest;
import com.tijoir.connection.dto.IncomingVendorContractResponse;
import com.tijoir.connection.dto.OffboardVendorResponse;
import com.tijoir.connection.dto.VendorContractResponse;
import com.tijoir.connection.dto.VendorContractGrantResponse;
import com.tijoir.connection.dto.VendorResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/incoming-contracts")
    public PageResponse<IncomingVendorContractResponse> listIncomingContracts(
            @AuthenticationPrincipal AuthenticatedUser user,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) VendorAccessContractStatus status
    ) {
        return vendorService.listIncomingContracts(user, page, size, status);
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

    @PostMapping("/contracts/{contractId}/accept")
    public IncomingVendorContractResponse acceptIncomingContract(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID contractId
    ) {
        return vendorService.acceptIncomingContract(user, contractId);
    }

    @GetMapping("/contracts/{contractId}/grants")
    public PageResponse<VendorContractGrantResponse> listGrants(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID contractId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) VendorContractGrantStatus status
    ) {
        return vendorService.listGrants(user, contractId, page, size, status);
    }

    @PostMapping("/contracts/{contractId}/grants")
    @ResponseStatus(HttpStatus.CREATED)
    public VendorContractGrantResponse createGrant(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID contractId,
            @Valid @RequestBody CreateVendorContractGrantRequest request
    ) {
        return vendorService.createGrant(user, contractId, request);
    }

    @PostMapping("/contracts/{contractId}/grants/{grantId}/revoke")
    public VendorContractGrantResponse revokeGrant(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID contractId,
            @PathVariable UUID grantId
    ) {
        return vendorService.revokeGrant(user, contractId, grantId);
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
    public ResponseEntity<OffboardVendorResponse> offboard(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID vendorId
    ) {
        return ResponseEntity.ok(vendorService.offboard(user, vendorId));
    }
}
