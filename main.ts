import { App } from "cdktf";
import { LineAudienceStack } from "./stacks/line-audience-stack";
import { getConfig } from "./config";

const app = new App();
const config = getConfig();;
new LineAudienceStack(app, "line_audience_stack", {
  projectId: config.projectId,
  location: config.location,
  lineClientId: config.lineClientId
});
app.synth();