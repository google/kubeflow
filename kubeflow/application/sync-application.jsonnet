function(request) {
  local util = import "util.libsonnet",
  local children = %(resources)s,
  local groupedResources = %(groupedResources)s,
  local groupByResource(resources) = {
    local getKey(resource) = {
      return::
        resource.kind,
    }.return,
    local getValue(resource) = {
      return::
        { [resource.metadata.name]+: resource },
    }.return,
    return:: util.foldl(getKey, getValue, resources),
  }.return,
  local comparator(a, b) = {
    return::
      if a.metadata.name == b.metadata.name then
        0
      else 
        if a.metadata.name < b.metadata.name then
          -1
        else
          1,
  }.return,
  local validateResource(resource) = {
    return::
      if std.type(resource) == "object" &&
      std.objectHas(resource, 'kind') &&
      std.objectHas(resource, 'apiVersion') &&
      std.objectHas(resource, 'metadata') &&
      std.objectHas(resource.metadata, 'name') then
        true
      else
        false,
  }.return,
  local validatedChildren = util.sort(std.filter(validateResource, children), comparator),
  local extractGroups(obj) =
    if std.type(obj) == "object" then
      [ obj[key] for key in std.objectFields(obj) ]
    else
      [],
  local extractResources(group) =
    if std.type(group) == "object" then
      [ group[key] for key in std.objectFields(group) ]
    else
      [],
  local curryResources(resources, exists) = {
    local existingResource(resource) = {
      local resourceExists(kind, name) = {
        return::
          if std.objectHas(resources, kind) &&
          std.objectHas(resources[kind], name) then
            true
          else
            false,
      }.return,
      return::
        if validateResource(resource) then 
          resourceExists(resource.kind, resource.metadata.name)
        else
          false,
    }.return,
    local missingResource(resource) = {
      return::
        existingResource(resource) == false,
    }.return,
    return:: 
      if exists == true then
        existingResource
      else
        missingResource
  }.return,
  local requestedChildren = 
    std.flattenArrays(std.map(extractResources, extractGroups(request.children))),
  local groupedRequestedChildren = groupByResource(requestedChildren),
  local installedChildren = 
    util.sort(std.filter(curryResources(groupedResources, true), requestedChildren), comparator),
  local missingChildren =
    util.sort(std.filter(curryResources(groupedRequestedChildren, false), validatedChildren), comparator),
  local desired = requestedChildren + missingChildren,
  local assemblyPhase = {
    return::
      if std.length(installedChildren) == std.length(validatedChildren) then
        "Succeeded"
      else
        "Pending",
  }.return,
  local info(resource) = {
    return::
     util.lower(resource.kind) + "s." + resource.apiVersion + "/" + resource.metadata.name,
  }.return,
  children: desired,
  status: {
    assemblyPhase: assemblyPhase,
    ready: "True",
    created: true,
    validated: util.sort(std.map(info, validatedChildren)),
    requested: util.sort(std.map(info, requestedChildren)),
    installed: util.sort(std.map(info, installedChildren)),
    missing: util.sort(std.map(info, missingChildren)),
    counts: {
      children: std.length(children),
      validated_children: std.length(validatedChildren),
      requested_children: std.length(requestedChildren),
      installed_children: std.length(installedChildren),
      missing_children: std.length(missingChildren),
    },
  },
}
