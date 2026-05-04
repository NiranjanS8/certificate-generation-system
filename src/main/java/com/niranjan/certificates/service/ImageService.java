package com.niranjan.certificates.service;

public interface ImageService {

    /**
     * Render the first page of a generated certificate PDF as a PNG image.
     * @return the file path where the PNG image was saved
     */
    String generateCertificateImage(String pdfPath, String uniqueCode);
}
