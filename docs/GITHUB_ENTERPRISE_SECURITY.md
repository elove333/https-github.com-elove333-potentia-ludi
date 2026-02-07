# GitHub Enterprise Security Features

**Last Updated**: 2026-02-07  
**Status**: Configuration Guide

## Overview

This document provides comprehensive guidance for configuring GitHub Enterprise features to enhance security and compliance for the Potentia Ludi repository. Implementing these features ensures the repository meets high standards for security, compliance, and access control.

## Table of Contents

1. [IP Allow Lists](#ip-allow-lists)
2. [Audit Log Streaming](#audit-log-streaming)
3. [Repository Rulesets](#repository-rulesets)
4. [Implementation Checklist](#implementation-checklist)

---

## IP Allow Lists

### Overview

IP Allow Lists restrict access to your GitHub Enterprise organization and repositories to specific, trusted IP addresses or ranges. This prevents unauthorized access from unknown locations and adds an additional layer of security.

### Benefits

- **Enhanced Security**: Only trusted networks can access repositories
- **Compliance**: Meet regulatory requirements for network access control
- **Audit Trail**: Track access attempts from non-allowed IPs
- **Geographic Control**: Restrict access to specific regions or offices

### Configuration Steps

#### 1. Navigate to Enterprise Settings

1. Sign in to GitHub Enterprise with administrator privileges
2. Navigate to your enterprise account settings
3. Click on **Policies** in the left sidebar
4. Select **IP allow list**

#### 2. Configure IP Allow List

1. Click **Enable IP allow list**
2. Add IP addresses or CIDR ranges:
   ```
   Example entries:
   - Single IP: 192.168.1.100
   - CIDR range: 10.0.0.0/8
   - Office network: 203.0.113.0/24
   ```

#### 3. Recommended IP Ranges

Configure the following trusted IP ranges for the Potentia Ludi repository:

**Corporate Office Networks**:
```
# Main Office
203.0.113.0/24

# Remote Office
198.51.100.0/24
```

**Cloud Infrastructure** (if applicable):
```
# CI/CD Runners
192.0.2.0/24

# Development VPN
198.18.0.0/15
```

**Individual Developer IPs** (optional):
```
# Senior Developer 1
203.0.113.10

# Senior Developer 2
203.0.113.11
```

#### 4. Testing and Validation

1. **Test Access**: Verify that authorized users can access the repository from allowed IPs
2. **Test Denial**: Confirm that access is blocked from non-allowed IPs
3. **Monitor Logs**: Check audit logs for blocked access attempts
4. **Emergency Access**: Configure emergency access procedures for critical situations

#### 5. Best Practices

- ✅ **Start Permissive**: Begin with broader ranges and narrow down over time
- ✅ **Document IPs**: Maintain a current list of all allowed IPs with descriptions
- ✅ **Regular Review**: Audit and update IP allow list quarterly
- ✅ **Emergency Plan**: Have a documented process for temporary IP additions
- ✅ **VPN Integration**: Consider using VPN endpoints for remote developer access
- ⚠️ **Avoid Overly Broad Ranges**: Don't allow entire ISP ranges (e.g., 0.0.0.0/0)
- ⚠️ **Monitor Changes**: Alert on IP allow list modifications

### Troubleshooting

**Users Cannot Access Repository**:
- Verify user's current IP address
- Check if IP is in the allow list
- Ensure CIDR notation is correct
- Verify IP allow list is enabled for the organization

**GitHub Actions Failing**:
- Add GitHub Actions IP ranges to allow list
- Consider using self-hosted runners with known IPs
- Reference: [GitHub Actions IP ranges](https://api.github.com/meta)

---

## Audit Log Streaming

### Overview

Audit Log Streaming enables real-time streaming of audit events from GitHub Enterprise to external Security Information and Event Management (SIEM) systems. This provides continuous monitoring, alerting, and compliance reporting capabilities.

### Benefits

- **Real-time Monitoring**: Immediate visibility into security events
- **Centralized Security**: Integrate with existing SIEM infrastructure
- **Compliance**: Meet audit and compliance requirements (SOC 2, ISO 27001, etc.)
- **Incident Response**: Faster detection and response to security incidents
- **Long-term Retention**: Maintain audit logs beyond GitHub's default retention period

### Supported Integrations

GitHub Enterprise supports streaming audit logs to:

- **Splunk** - Enterprise SIEM and log management
- **Azure Event Hubs** - Microsoft Azure streaming platform
- **Amazon S3** - AWS object storage
- **Datadog** - Monitoring and security platform
- **Google Cloud Pub/Sub** - Google Cloud messaging service

### Configuration Steps

#### Option 1: Splunk Integration

1. **Configure Splunk HTTP Event Collector (HEC)**:
   ```bash
   # In Splunk UI:
   # Settings > Data Inputs > HTTP Event Collector
   # Create new token with name "GitHub Enterprise Audit Logs"
   ```

2. **Configure GitHub Enterprise**:
   - Navigate to Enterprise Settings > Audit log
   - Click **Add stream**
   - Select **Splunk**
   - Enter configuration:
     ```
     Name: Splunk Production SIEM
     Endpoint: https://splunk.example.com:8088
     Token: [Your HEC Token]
     ```

3. **Verify Stream**:
   - Perform a test action in GitHub (e.g., create a repository)
   - Check Splunk for corresponding audit event
   - Search query: `index=github_audit`

#### Option 2: Azure Event Hubs

1. **Create Event Hub**:
   ```bash
   # Using Azure CLI
   az eventhubs namespace create \
     --name github-audit-logs \
     --resource-group security-logs \
     --location eastus
   
   az eventhubs eventhub create \
     --name audit-stream \
     --namespace-name github-audit-logs \
     --resource-group security-logs
   ```

2. **Get Connection String**:
   ```bash
   az eventhubs namespace authorization-rule keys list \
     --resource-group security-logs \
     --namespace-name github-audit-logs \
     --name RootManageSharedAccessKey
   ```

3. **Configure GitHub Enterprise**:
   - Navigate to Enterprise Settings > Audit log
   - Click **Add stream**
   - Select **Azure Event Hubs**
   - Enter configuration:
     ```
     Name: Azure Event Hubs Production
     Connection String: [Your Connection String]
     Event Hub Name: audit-stream
     ```

4. **Configure Azure Stream Analytics** (optional):
   ```sql
   -- Process and route audit events
   SELECT 
     timestamp,
     actor,
     action,
     repo,
     org
   INTO [output-sink]
   FROM [input-stream]
   WHERE action IN ('repo.create', 'repo.delete', 'team.add_member')
   ```

#### Option 3: Amazon S3

1. **Create S3 Bucket**:
   ```bash
   aws s3api create-bucket \
     --bucket github-audit-logs-production \
     --region us-east-1
   
   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket github-audit-logs-production \
     --versioning-configuration Status=Enabled
   ```

2. **Create IAM Policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl"
         ],
         "Resource": "arn:aws:s3:::github-audit-logs-production/*"
       }
     ]
   }
   ```

3. **Configure GitHub Enterprise**:
   - Navigate to Enterprise Settings > Audit log
   - Click **Add stream**
   - Select **Amazon S3**
   - Enter configuration:
     ```
     Name: S3 Audit Archive
     Bucket: github-audit-logs-production
     Region: us-east-1
     Access Key ID: [Your Access Key]
     Secret Access Key: [Your Secret Key]
     ```

### Audit Events to Monitor

Configure alerts for the following critical events:

**Security Events**:
```
- org.add_member
- org.remove_member
- org.update_member
- team.add_member
- team.remove_member
- repo.access
- repo.transfer
- oauth_application.create
- oauth_application.transfer
```

**Compliance Events**:
```
- repo.create
- repo.delete
- repo.archive
- protected_branch.create
- protected_branch.destroy
- secret_scanning.disable
```

**Configuration Changes**:
```
- integration_installation.create
- integration_installation.destroy
- repository_ruleset.create
- repository_ruleset.update
- repository_ruleset.destroy
```

### Sample SIEM Queries

**Splunk**:
```spl
# Failed authentication attempts
index=github_audit action="auth.fail" 
| stats count by actor 
| where count > 5

# Repository deletions
index=github_audit action="repo.destroy" 
| table timestamp actor repo

# Admin privilege escalations
index=github_audit action="org.update_member" 
| where role="admin"
```

**Azure Sentinel (KQL)**:
```kusto
// Suspicious repository access
GitHubAuditLogs
| where Action == "repo.access"
| where Actor !in (allowed_users)
| summarize count() by Actor, Repo

// After-hours administrative actions
GitHubAuditLogs
| where Action startswith "org."
| where hourofday(Timestamp) !between (8 .. 18)
| project Timestamp, Actor, Action, Repo
```

### Best Practices

- ✅ **Multiple Streams**: Configure multiple destinations for redundancy
- ✅ **Retention Policy**: Define log retention periods (recommended: 1+ years)
- ✅ **Encryption**: Ensure streams use TLS/SSL encryption
- ✅ **Access Control**: Restrict SIEM access to security team only
- ✅ **Alert Tuning**: Refine alerts to reduce false positives
- ✅ **Regular Testing**: Verify streaming functionality monthly
- ✅ **Documentation**: Document SIEM integration and runbooks

---

## Repository Rulesets

### Overview

Repository Rulesets provide fine-grained control over repository operations, enforcing security and compliance policies at the branch and tag level. They replace and enhance traditional branch protection rules.

### Benefits

- **Commit Signing**: Require verified commits for accountability
- **Branch Protection**: Prevent force pushes and deletions
- **Naming Conventions**: Enforce consistent branch naming
- **Pull Request Requirements**: Mandate code reviews and status checks
- **Deployment Control**: Restrict who can deploy to production

### Configuration Steps

#### 1. Navigate to Repository Settings

1. Go to the Potentia Ludi repository
2. Click **Settings** tab
3. Select **Rules** > **Rulesets** from sidebar
4. Click **New ruleset** > **New branch ruleset**

#### 2. Create Production Branch Ruleset

**Ruleset Name**: `Production Branch Protection`

**Target branches**:
```
main
production
release/*
```

**Rules to Enable**:

**Branch Protection**:
- ✅ Restrict deletions
- ✅ Require linear history
- ✅ Require signed commits
- ✅ Block force pushes

**Pull Request Requirements**:
- ✅ Require pull request before merging
  - Required approving reviews: 2
  - Dismiss stale reviews on new commits: Yes
  - Require review from code owners: Yes
- ✅ Require status checks to pass
  - Require branches to be up to date: Yes
  - Status checks:
    - `build`
    - `test`
    - `security-scan`
    - `lint`

**Additional Restrictions**:
- ✅ Require conversation resolution before merging
- ✅ Require deployments to succeed before merging

#### 3. Create Development Branch Ruleset

**Ruleset Name**: `Development Branch Standards`

**Target branches**:
```
dev
develop
feature/*
bugfix/*
hotfix/*
```

**Rules to Enable**:

**Branch Protection**:
- ✅ Require signed commits
- ⚠️ Block force pushes (disabled for `feature/*`)

**Pull Request Requirements**:
- ✅ Require pull request before merging to `dev`
  - Required approving reviews: 1
  - Require review from code owners: No

**Naming Convention**:
- ✅ Branch name pattern:
  ```regex
  ^(feature|bugfix|hotfix|chore)/[a-z0-9-]+$
  ```

#### 4. Create Tag Protection Ruleset

**Ruleset Name**: `Release Tag Protection`

**Target tags**:
```
v*
release-*
```

**Rules to Enable**:
- ✅ Require signed tags
- ✅ Restrict tag creation (limit to release managers)
- ✅ Restrict tag deletion (limit to administrators)

#### 5. Commit Signing Setup

To enforce commit signing, developers must configure GPG or SSH signing:

**GPG Signing**:
```bash
# Generate GPG key
gpg --full-generate-key

# List keys
gpg --list-secret-keys --keyid-format=long

# Configure Git
git config --global user.signingkey [KEY_ID]
git config --global commit.gpgsign true

# Add GPG key to GitHub
gpg --armor --export [KEY_ID]
# Paste in GitHub Settings > SSH and GPG keys
```

**SSH Signing** (recommended):
```bash
# Generate SSH signing key
ssh-keygen -t ed25519 -C "signing-key@example.com" -f ~/.ssh/id_ed25519_signing

# Configure Git
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519_signing.pub
git config --global commit.gpgsign true

# Add SSH key to GitHub
cat ~/.ssh/id_ed25519_signing.pub
# Paste in GitHub Settings > SSH and GPG keys (as Signing Key)
```

### Recommended Rulesets for Potentia Ludi

#### Ruleset 1: Main Branch (Production)

```yaml
Name: Main Branch Protection
Target: refs/heads/main
Rules:
  - Restrict deletions: true
  - Restrict force pushes: true
  - Require signed commits: true
  - Require linear history: true
  - Require pull request:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
  - Require status checks:
      strict: true
      checks:
        - build
        - test
        - security-scan
        - codeql
  - Require conversation resolution: true
Bypass: []
```

#### Ruleset 2: Development Branches

```yaml
Name: Development Branch Standards
Target: refs/heads/dev, refs/heads/feature/*, refs/heads/bugfix/*
Rules:
  - Require signed commits: true
  - Require pull request:
      required_approving_review_count: 1
  - Require status checks:
      checks:
        - build
        - test
Bypass: 
  - repository_admins
```

#### Ruleset 3: Release Tags

```yaml
Name: Release Tag Protection
Target: refs/tags/v*, refs/tags/release-*
Rules:
  - Restrict deletions: true
  - Restrict updates: true
  - Require signed tags: true
  - Creation: Limited to release-managers team
Bypass: []
```

#### Ruleset 4: Branch Naming Enforcement

```yaml
Name: Branch Naming Convention
Target: refs/heads/*
Rules:
  - Branch name pattern:
      pattern: ^(main|dev|feature|bugfix|hotfix|chore|release)/[a-z0-9-]+$
      operator: matches
Bypass:
  - repository_admins
```

### Testing Rulesets

Before enforcing rulesets, test them in evaluation mode:

1. **Create Test Branch**:
   ```bash
   git checkout -b test/ruleset-validation
   ```

2. **Test Unsigned Commit** (should fail):
   ```bash
   git config commit.gpgsign false
   git commit -m "Test unsigned commit"
   git push origin test/ruleset-validation
   # Expected: Push rejected due to unsigned commit
   ```

3. **Test Signed Commit** (should succeed):
   ```bash
   git config commit.gpgsign true
   git commit --amend -S -m "Test signed commit"
   git push origin test/ruleset-validation
   # Expected: Push accepted
   ```

4. **Test Force Push** (should fail on protected branches):
   ```bash
   git checkout main
   git push --force origin main
   # Expected: Push rejected due to force push protection
   ```

### Ruleset Monitoring

Monitor ruleset effectiveness:

**Metrics to Track**:
- Unsigned commit rejection rate
- Force push attempts blocked
- Pull requests requiring additional reviews
- Average time from PR creation to merge

**Audit Queries**:
```spl
# Splunk query for ruleset violations
index=github_audit action="git.push_reject" 
| stats count by reason, actor
```

### Best Practices

- ✅ **Start Lenient**: Begin with warnings, then enforce gradually
- ✅ **Communicate**: Notify team before enabling strict rules
- ✅ **Document Exceptions**: Maintain list of approved bypass scenarios
- ✅ **Regular Review**: Audit ruleset effectiveness quarterly
- ✅ **Team Training**: Ensure all developers understand commit signing
- ✅ **Automation**: Use GitHub Actions to validate branch naming
- ⚠️ **Avoid Over-Restriction**: Balance security with developer productivity
- ⚠️ **Emergency Access**: Define clear escalation procedures

---

## Implementation Checklist

Use this checklist to implement GitHub Enterprise security features:

### Phase 1: Planning (Week 1)

- [ ] Review current security posture and gaps
- [ ] Identify required IP ranges for allow list
- [ ] Select SIEM platform for audit log streaming
- [ ] Define repository ruleset requirements
- [ ] Obtain stakeholder approval for security changes
- [ ] Schedule team training sessions

### Phase 2: IP Allow List Setup (Week 2)

- [ ] Document all trusted IP addresses and ranges
- [ ] Configure IP allow list in test mode
- [ ] Test access from allowed IPs
- [ ] Test access denial from non-allowed IPs
- [ ] Enable IP allow list for production
- [ ] Monitor for access issues
- [ ] Document emergency access procedures

### Phase 3: Audit Log Streaming (Week 2-3)

- [ ] Provision SIEM infrastructure (Splunk/Azure/AWS)
- [ ] Configure audit log stream in GitHub Enterprise
- [ ] Verify audit events are being received
- [ ] Create baseline security monitoring queries
- [ ] Configure alerts for critical events
- [ ] Define incident response procedures
- [ ] Document SIEM access and procedures

### Phase 4: Repository Rulesets (Week 3-4)

- [ ] Create test repository for ruleset validation
- [ ] Configure production branch ruleset
- [ ] Configure development branch ruleset
- [ ] Configure tag protection ruleset
- [ ] Configure branch naming enforcement
- [ ] Train developers on commit signing
- [ ] Enable rulesets in evaluation mode
- [ ] Monitor for issues and adjust rules
- [ ] Enable enforcement mode
- [ ] Document bypass procedures

### Phase 5: Validation and Documentation (Week 4)

- [ ] Test all security features end-to-end
- [ ] Verify IP allow list is working correctly
- [ ] Verify audit logs are streaming successfully
- [ ] Verify rulesets are enforcing policies
- [ ] Create runbooks for common scenarios
- [ ] Update team documentation
- [ ] Conduct team training
- [ ] Schedule quarterly security review

## Security Compliance Benefits

Implementing these GitHub Enterprise features provides:

### Compliance Framework Coverage

**SOC 2 Type II**:
- ✅ Access control (IP Allow Lists)
- ✅ Audit logging and monitoring (Audit Log Streaming)
- ✅ Change management (Repository Rulesets)

**ISO 27001**:
- ✅ A.9: Access Control
- ✅ A.12: Operations Security
- ✅ A.14: System Acquisition, Development and Maintenance

**NIST Cybersecurity Framework**:
- ✅ PR.AC: Identity Management and Access Control
- ✅ DE.CM: Security Continuous Monitoring
- ✅ PR.IP: Information Protection Processes and Procedures

**GDPR**:
- ✅ Article 32: Security of Processing
- ✅ Article 33: Notification of Personal Data Breach

## Troubleshooting

### Common Issues and Solutions

**Issue**: Developers cannot push commits
- **Cause**: Unsigned commits with signing requirement enabled
- **Solution**: Configure GPG/SSH commit signing (see Commit Signing Setup)

**Issue**: GitHub Actions failing after IP allow list enabled
- **Cause**: GitHub Actions runners not in allow list
- **Solution**: Add GitHub Actions IP ranges or use self-hosted runners

**Issue**: Audit logs not appearing in SIEM
- **Cause**: Connection issues or authentication failure
- **Solution**: Verify credentials, test connectivity, check firewall rules

**Issue**: False positives from audit log alerts
- **Cause**: Alert rules too broad
- **Solution**: Refine SIEM queries with whitelists and better conditions

## Additional Resources

- [GitHub Enterprise Security Best Practices](https://docs.github.com/enterprise-server/admin/security)
- [GitHub Audit Log Events](https://docs.github.com/en/organizations/keeping-your-organization-secure/reviewing-the-audit-log-for-your-organization)
- [Repository Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets)
- [Commit Signature Verification](https://docs.github.com/en/authentication/managing-commit-signature-verification)

## Support and Feedback

For questions or issues with GitHub Enterprise security features:
- GitHub Enterprise Support: https://support.github.com/
- Internal Security Team: security@example.com
- Incident Response: See [SECURITY_ADVISORY.md](./SECURITY_ADVISORY.md)

---

**Document Version**: 1.0  
**Last Reviewed**: 2026-02-07  
**Next Review**: 2026-05-07 (Quarterly)
