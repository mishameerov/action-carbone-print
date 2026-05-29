import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'carbonePrintTemplates',
  migrationRules: ['overwrite', 'schema-only'],
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'string',
      name: 'title',
      required: true,
    },
    {
      type: 'text',
      name: 'description',
    },
    {
      type: 'boolean',
      name: 'isActive',
      defaultValue: true,
    },
    {
      type: 'belongsTo',
      name: 'attachment',
      target: 'attachments',
      foreignKey: 'attachmentId',
      interface: 'm2o',
    },
  ],
});
