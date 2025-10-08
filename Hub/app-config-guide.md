# App Configuration Guide

## Treeview Item Configuration

- id: The ID of the item in the webmap (not the itemId).
- isDownloadable: `true` if the download icon should appear for the item; otherwise, `false`. If undefined, it will use item default configuration.
- isVisible: `true` if the visiblity icon should appear for the item; otherwise, `false`. If undefined, it will use item default configuration.
- isHidden: `true` if the item should appear in the treeview; otherwise, `false`.
- visibilityDependencyIds: the IDs of the layers that also become visible when the layer is made visible. This is inherited from the parent if undefined.
- visibilityGroupId: the group the item belongs to. This is inherited from the parent if undefined.

Note: `_name` is for readability purposes only.
