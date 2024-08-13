import { Construct } from "constructs";
import { Fn } from 'cdktf';
import { resolve } from 'path';
import * as google from "@cdktf/provider-google";

type WorkflowConstructProps = {
    location: string;
    datasetId: string;
    lineClientId: string;
    tableName: string;
}

export class WorkflowConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WorkflowConstructProps) {
    super(scope, id);

  
    const workflowsSa = new google.serviceAccount.ServiceAccount(this, 'workflow_sa', {
        accountId: 'create-line-audience-sa',
        displayName: 'Line Workflow Service Account',
      });
    
    new google.projectIamMember.ProjectIamMember(this, 'bq_data_viewer', {
        role: 'roles/bigquery.dataViewer',
        project: workflowsSa.project,
        member: workflowsSa.member,
    })

    new google.projectIamMember.ProjectIamMember(this, 'bq_job_user', {
      role: 'roles/bigquery.jobUser',
      project: workflowsSa.project,
      member: workflowsSa.member,
    })

    new google.projectIamMember.ProjectIamMember(this, 'gcs_obj_viewer', {
      role: 'roles/storage.objectViewer',
      project: workflowsSa.project,
      member: workflowsSa.member,
    })

    new google.projectIamMember.ProjectIamMember(this, 'log_writer', {
      role: 'roles/logging.logWriter',
      project: workflowsSa.project,
      member: workflowsSa.member,
    })

    const secretId = 'line_secret'
    const secret = new google.secretManagerSecret.SecretManagerSecret(this, 'line_secret', {
      secretId,
      replication: {
        auto: {}
      }
    })

    new google.secretManagerSecretVersion.SecretManagerSecretVersion(this, 'line_secret_version', {
      secret: secret.id,
      secretData: 'デプロイ後に手動で書き換える',
      lifecycle: {
        ignoreChanges: 'all'
      }
    })

    new google.secretManagerSecretIamMember.SecretManagerSecretIamMember(this, 'secret_accessor', {
      secretId: secret.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: workflowsSa.member,
    });


    const templatePath = resolve(__dirname, '..', 'workflow.yaml');
    const templateFile = Fn.templatefile(templatePath, {
      lineClientId: props.lineClientId,
      secretId,
      dataset: props.datasetId,
      table: props.tableName,
    });
    new google.workflowsWorkflow.WorkflowsWorkflow(this, 'Default', {
        description: 'BigQueryのクエリ結果からLineのAudienceを作成するワークフロー',
        serviceAccount: workflowsSa.email,
        name: 'create-line-audience-workflow',
        region: props.location,
        sourceContents: templateFile,
    });
  }
}