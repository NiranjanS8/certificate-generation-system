package com.niranjan.certificates.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ScoreNotEligibleException extends RuntimeException {

    public ScoreNotEligibleException(String message) {
        super(message);
    }

    public ScoreNotEligibleException(int score, int minimumScore) {
        super(String.format("Recipient score %d does not meet the minimum required score of %d", score, minimumScore));
    }
}
