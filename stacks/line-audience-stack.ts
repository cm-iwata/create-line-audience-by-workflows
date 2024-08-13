import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as google from "@cdktf/provider-google";
import { DwhConstruct } from "../constructs/dwh";
import { RandomProvider } from "@cdktf/provider-random/lib/provider";
import { WorkflowConstruct } from "../constructs/workflow";
import { Config } from "../config";

type LineAudienceStackProps = Config;

export class LineAudienceStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: LineAudienceStackProps) {
    super(scope, id);

    const {location, projectId} = props;
    new google.provider.GoogleProvider(this, 'GoogleProvider', {
        project: projectId,
      });

    new RandomProvider(this, 'random-provider');

    const dwh = new DwhConstruct(this, 'dwh', {
      location,
    });

    new WorkflowConstruct(this, "workflow", {
      location,
      datasetId: dwh.datasetId,
      lineClientId: props.lineClientId,
      tableName: dwh.tableName,
    });
  }
}