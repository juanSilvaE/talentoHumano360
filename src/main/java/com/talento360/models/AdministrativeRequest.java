package com.talento360.models;

public class AdministrativeRequest {
    private final int requestId;
    private final String department;
    private final String person;
    private final String document;
    private final String jobTitle;
    private final String startDateValue;
    private final String totalDays;
    private final String periods;
    private final String notes;
    private final String employmentType;
    private final String requestDate;
    private String status;

    public AdministrativeRequest(int requestId, String department, String person, String document, String jobTitle,
                    String startDateValue, String totalDays, String periods,
                    String notes, String employmentType) {
        this(requestId, department, person, document, jobTitle, startDateValue, totalDays,
                periods, notes, employmentType, "");
    }

    public AdministrativeRequest(int requestId, String department, String person, String document, String jobTitle,
                    String startDateValue, String totalDays, String periods,
                    String notes, String employmentType, String status) {
        this(requestId, department, person, document, jobTitle, startDateValue, totalDays,
                periods, notes, employmentType, status, "");
    }

    public AdministrativeRequest(int requestId, String department, String person, String document, String jobTitle,
                    String startDateValue, String totalDays, String periods,
                    String notes, String employmentType, String status, String requestDate) {
        this.requestId = requestId;
        this.department = department;
        this.person = person;
        this.document = document;
        this.jobTitle = jobTitle;
        this.startDateValue = startDateValue;
        this.totalDays = totalDays;
        this.periods = periods;
        this.notes = notes;
        this.employmentType = employmentType;
        this.status = status;
        this.requestDate = requestDate;
    }

    public int getRequestId() { return requestId; }
    public String getDepartment() { return department; }
    public String getPerson() { return person; }
    public String getDocument() { return document; }
    public String getJobTitle() { return jobTitle; }
    public String getStartDate() { return startDateValue; }
    public String getTotalDays() { return totalDays; }
    public String getPeriods() { return periods; }
    public String getNotes() { return notes; }
    public String getRequestType() { return employmentType; }
    public String getRequestDate() { return requestDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
