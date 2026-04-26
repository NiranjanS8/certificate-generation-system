package com.niranjan.certificates.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class IneligibleRecipientException extends RuntimeException {

    public IneligibleRecipientException(String message) {
        super(message);
    }

    public IneligibleRecipientException(String recipientName, int score, int minScore, String courseName) {
        super(String.format("Recipient '%s' with score %d does not meet the minimum score of %d required for course '%s'",
                recipientName, score, minScore, courseName));
    }
}
