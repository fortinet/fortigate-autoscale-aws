import * as JSYAML from 'js-yaml';

type Kind = 'scalar' | 'sequence' | 'mapping';
interface CfnCustomTag {
    name: string;
    kind: Kind;
}

export interface Template {
    AWSTemplateFormatVersion: string;
    Description: string;
    Parameters: {
        [key: string]: {
            Type: string;
            Description: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [key: string]: any;
        };
    };
    Rules?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    Conditions?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    Resources?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    Metadata?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    Outputs?: {
        [key: string]: {
            Description: string;
            Value: string;
        };
    };
}

function createTag(tag: string, kind: Kind): JSYAML.Type {
    if (kind === 'scalar') {
        return new JSYAML.Type(tag, {
            kind: kind,
            resolve: (data): boolean => {
                return data !== null && typeof data === 'string';
            },
            construct: (data): object => {
                const d = {};
                d[tag] = data;
                return d;
            },
            predicate: (data): boolean => {
                return !!data[tag];
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            represent: (data): any => {
                return data[tag];
            }
        });
    } else if (kind === 'mapping') {
        return new JSYAML.Type(tag, {
            kind: kind,
            resolve: (data): boolean => {
                return data !== null && data instanceof Object;
            },
            construct: (data): object => {
                const d = {};
                d[tag] = data;
                return d;
            },
            predicate: (data): boolean => {
                return !!data[tag];
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            represent: (data): any => {
                return data[tag];
            }
        });
    } else {
        return new JSYAML.Type(tag, {
            kind: kind,
            resolve: (data): boolean => {
                return data !== null && data instanceof Array;
            },
            construct: (data): object => {
                const d = {};
                d[tag] = data;
                return d;
            },
            predicate: (data): boolean => {
                return !!data[tag];
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            represent: (data): any => {
                return data[tag];
            }
        });
    }
}

const cfnCustomTags: CfnCustomTag[] = [
    { name: '!And', kind: 'sequence' },
    { name: 'Fn::And', kind: 'sequence' },
    { name: '!Base64', kind: 'mapping' },
    { name: 'Fn::Base64', kind: 'mapping' },
    { name: '!Cidr', kind: 'sequence' },
    { name: 'Fn::Cidr', kind: 'sequence' },
    { name: '!Equals', kind: 'sequence' },
    { name: 'Fn::Equals', kind: 'sequence' },
    { name: '!FindInMap', kind: 'sequence' },
    { name: 'Fn::FindInMap', kind: 'sequence' },
    { name: '!GetAtt', kind: 'sequence' },
    { name: 'Fn::GetAtt', kind: 'sequence' },
    { name: '!GetAZs', kind: 'scalar' },
    { name: 'Fn::GetAZs', kind: 'scalar' },
    { name: '!If', kind: 'sequence' },
    { name: 'Fn::If', kind: 'sequence' },
    { name: '!ImportValue', kind: 'mapping' },
    { name: 'Fn::ImportValue', kind: 'mapping' },
    { name: '!Join', kind: 'sequence' },
    { name: 'Fn::Join', kind: 'sequence' },
    { name: '!Not', kind: 'sequence' },
    { name: 'Fn::Not', kind: 'sequence' },
    { name: '!Or', kind: 'sequence' },
    { name: 'Fn::Or', kind: 'sequence' },
    { name: '!Ref', kind: 'scalar' },
    { name: 'Fn::Ref', kind: 'scalar' },
    { name: '!Select', kind: 'sequence' },
    { name: 'Fn::Select', kind: 'sequence' },
    { name: '!Split', kind: 'sequence' },
    { name: 'Fn::Split', kind: 'sequence' },
    { name: '!Sub', kind: 'sequence' },
    { name: 'Fn::Sub', kind: 'sequence' },
    { name: '!Transform', kind: 'sequence' },
    { name: 'Fn::Transform', kind: 'sequence' }
];

export const CFN_YAML_SCHEMA = new JSYAML.Schema({
    include: [JSYAML.CORE_SCHEMA],
    explicit: cfnCustomTags.map(({ name, kind }) => {
        return createTag(name, kind);
    })
});

export function parseYAML(str: string): string | number | object {
    return JSYAML.load(str, { schema: CFN_YAML_SCHEMA });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyYAML(obj: any, indent = 4, lineWidth = 80): string {
    let str = JSYAML.safeDump(obj, {
        schema: CFN_YAML_SCHEMA,
        indent: indent > 0 ? indent : 4,
        lineWidth: lineWidth > 0 ? lineWidth : 80
    });
    // NOTE: must convert !<!tagname> to !tagname
    cfnCustomTags.forEach(({ name }) => {
        str = str.replace(new RegExp(`!<${name}>`, 'gm'), name);
    });
    return str;
}
