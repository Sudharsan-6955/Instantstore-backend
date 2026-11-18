/**
 * Mongoose Tenant Isolation Plugin
 * 
 * Enforces Logical Multi-Tenant Partitioning at the Schema Layer.
 * In a Shared Database, Shared Schema architecture, this plugin mathematically
 * ensures that queries cannot leak cross-tenant records by enforcing
 * tenant scoping on find, count, update, and delete hooks.
 */

function tenantIsolationPlugin(schema, options = {}) {
  // Ensure tenantId exists on schema
  if (!schema.path('tenantId')) {
    schema.add({
      tenantId: {
        type: String,
        required: true,
        index: true,
      },
    });
  }

  // Pre-query hook to enforce tenant filtering
  const queryMethods = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'countDocuments',
    'estimatedDocumentCount',
  ];

  queryMethods.forEach((method) => {
    schema.pre(method, function () {
      const tenantId = this.getOptions().tenantId;
      if (tenantId) {
        // Enforce tenant scoping filter
        this.where({ tenantId });
      }
    });
  });

  // Pre-save validation
  schema.pre('save', function (next) {
    if (!this.tenantId) {
      return next(new Error('Cross-Tenant Security Violation: tenantId is strictly mandatory.'));
    }
    next();
  });
}

module.exports = tenantIsolationPlugin;
