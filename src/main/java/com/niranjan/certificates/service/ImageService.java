package com.niranjan.certificates.service;

import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.entity.Signatory;

public interface ImageService {

    /**
     * Generate a landscape certificate image and save it to disk.
     * @return the file path where the PNG image was saved
     */
    String generateCertificateImage(Organization org, Recipient recipient, Signatory signatory,
                                    String certificateTitle, String uniqueCode);
}
