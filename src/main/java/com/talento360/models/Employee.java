package com.talento360.models;

public class Employee {
    private final String recordId;
    private final String documentId;
    private final String fullName;
    private final String department;
    private final String currentJobTitle;
    private final String baseJobTitle;
    private final String email;
    private final String phone;
    private final String employmentStatus;
    private final String startDateValue;
    private final String gender;

    public Employee(String recordId, String documentId, String fullName, String department,
                    String currentJobTitle, String baseJobTitle, String email, String phone,
                    String employmentStatus, String startDateValue, String gender) {
        this.recordId = recordId;
        this.documentId = documentId;
        this.fullName = fullName;
        this.department = department;
        this.currentJobTitle = currentJobTitle;
        this.baseJobTitle = baseJobTitle;
        this.email = email;
        this.phone = phone;
        this.employmentStatus = employmentStatus;
        this.startDateValue = startDateValue;
        this.gender = gender;
    }

    public String getRecordId() { return recordId; }
    public String getDocumentId() { return documentId; }
    public String getFullName() { return fullName; }
    public String getDepartment() { return department; }
    public String getCurrentJobTitle() { return currentJobTitle; }
    public String getBaseJobTitle() { return baseJobTitle; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getEmploymentStatus() { return employmentStatus; }
    public String getStartDate() { return startDateValue; }
    public String getGender() { return gender; }
}
