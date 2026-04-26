package com.niranjan.certificates.service;

import com.niranjan.certificates.entity.Certificate;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.entity.Signatory;

public interface PdfService {

    /**
     * Generate a landscape A4 PDF certificate and save it to disk.
     * @return the file path where the PDF was saved
     */
    String generateCertificate(Organization org, Recipient recipient, Signatory signatory,
                               String certificateTitle, String uniqueCode);
}
