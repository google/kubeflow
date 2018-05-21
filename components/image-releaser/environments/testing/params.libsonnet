local params = std.extVar("__ksonnet/params");
local globals = import "globals.libsonnet";
local envParams = params + {
  components+: {
    workflows+: {
      name: "test2"
    }
  }
};

{
  components: {
    [x]: envParams.components[x] + globals for x in std.objectFields(envParams.components)
  }
}