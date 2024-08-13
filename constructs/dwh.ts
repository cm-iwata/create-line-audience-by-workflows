import { Construct } from "constructs";
import * as google from "@cdktf/provider-google";
import { StringResource } from '@cdktf/provider-random/lib/string-resource';
import { resolve }  from 'path';
import { readFileSync, readdirSync }  from 'fs';

type DwhConstructProps = {
    location: string;
}

export class DwhConstruct extends Construct {

  readonly datasetId: string
  readonly tableName: string

  constructor(scope: Construct, id: string, props: DwhConstructProps) {
    super(scope, id);

    const { location } = props;
    this.datasetId = 'line_dataset';
    const dataset = new google.bigqueryDataset.BigqueryDataset(this, 'dataset', {
        datasetId: this.datasetId,
        friendlyName: 'Line Dataset',
        description: 'Line Dataset',
        location,
    })

    const bucketSuffix = new StringResource(this, 'randomString', {
        length: 8,
        special: false,
        upper: false,
      }).result;


    const bucket = new google.storageBucket.StorageBucket(this, 'bucket', {
        name: `line-audience-bucket-${bucketSuffix}`,
        location,
        forceDestroy: true,
    })

    const assetsDir = resolve(__dirname, '..', 'assets', 'line-users');    
    readdirSync(assetsDir).map((file, idx) => {
        new google.storageBucketObject.StorageBucketObject(this, `object_${idx}`, {
            bucket: bucket.id,
            name: file,
            content: readFileSync(`${assetsDir}/${file}`).toString(),
        })
    })    

    this.tableName = 'line_users';
    new google.bigqueryTable.BigqueryTable(this, 'line_users_table', {
        datasetId: dataset.datasetId,
        tableId: this.tableName,
        externalDataConfiguration: {
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            sourceUris: [
                `gs://${bucket.name}/*`
            ],
            autodetect: false,
            schema: JSON.stringify([
                {
                    "name": "id",
                    "type": "STRING",
                    "mode": "REQUIRED",
                    "description": "LINEのユーザーID"
                },
                {
                    "name": "pref",
                    "type": "STRING",
                    "mode": "REQUIRED",
                    "description": "都道府県"
                },
            ])
        },
        deletionProtection: false,
    })
  }
}