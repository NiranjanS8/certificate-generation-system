package com.niranjan.certificates.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "signatories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Signatory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String name;

    private String title;

    @Column(name = "signature_url")
    private String signatureUrl;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;
}
