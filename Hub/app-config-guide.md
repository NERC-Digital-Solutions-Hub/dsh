# App Configuration Guide

This guide describes how to configure the Treeview components (`areaTreeview` and `dataTreeview`) in the application configuration JSON.

## Treeview Configuration Structure

The treeview configuration consists of four main sections:

1. **items**: Configuration for specific layers/nodes.
2. **visibilityGroups**: Rules for exclusive visibility (e.g., radio buttons).
3. **inheritanceGroups**: Rules for property inheritance between parent and child nodes.
4. **fieldsToHide**: Global list of fields to exclude from the treeview.

```json
{
  "areaTreeview": {
    "items": [ ... ],
    "visibilityGroups": [ ... ],
    "inheritanceGroups": [ ... ],
    "fieldsToHide": [ ... ]
  }
}
```

### 1. Treeview Items (`items`)

The `items` array defines configuration for specific nodes in the tree. Each item is matched to a layer in the WebMap by its `id`.

| Property                  | Type       | Description                                                                                              |
| :------------------------ | :--------- | :------------------------------------------------------------------------------------------------------- |
| `id`                      | `string`   | **Required.** The ID of the layer in the WebMap (not the Portal Item ID).                                |
| `_name`                   | `string`   | Optional. A human-readable name for the item, used only for documentation in the config file.            |
| `isDownloadable`          | `boolean`  | If `true`, a download button will appear for this item.                                                  |
| `isVisibleOnInit`         | `boolean`  | If `true`, the layer will be visible when the application loads.                                         |
| `isHidden`                | `boolean`  | If `true`, the layer will be completely hidden from the treeview.                                        |
| `disableVisibilityToggle` | `boolean`  | If `true`, the user cannot toggle the visibility of this layer (e.g., for mandatory base layers).        |
| `isOpenOnInit`            | `boolean`  | If `true`, the group/folder will be expanded by default.                                                 |
| `showFields`              | `boolean`  | If `true`, the fields of this feature layer will be listed as child nodes in the tree.                   |
| `visibilityDependencyIds` | `string[]` | An array of other layer IDs that should automatically toggle visibility when this layer is toggled.      |
| `visibilityGroupId`       | `string`   | The ID of a `visibilityGroup` this item belongs to. Used for radio-button behavior.                      |
| `inheritanceGroupId`      | `string`   | The ID of an `inheritanceGroup` to use for property inheritance logic.                                   |
| `customConverterId`       | `string`   | ID of a custom node converter to use (e.g., `"aliasPath"` for folder structures based on layer aliases). |

### 2. Visibility Groups (`visibilityGroups`)

Visibility groups allow you to enforce constraints on how many layers can be visible at once within a group (e.g., radio button behavior where only one layer can be active).

| Property           | Type     | Description                                                                                                          |
| :----------------- | :------- | :------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string` | **Required.** Unique identifier for the group. Referenced by `visibilityGroupId` in items.                           |
| `maxVisibleLayers` | `number` | The maximum number of layers in this group that can be visible simultaneously. Set to `1` for radio-button behavior. |

**Example:**

```json
{
	"id": "group:basemaps",
	"maxVisibleLayers": 1
}
```

### 3. Inheritance Groups (`inheritanceGroups`)

Inheritance groups define which properties a child node should inherit from its parent node or the group configuration. This reduces repetition in the configuration.

| Property              | Type       | Description                                                                                 |
| :-------------------- | :--------- | :------------------------------------------------------------------------------------------ |
| `id`                  | `string`   | **Required.** Unique identifier for the group. Referenced by `inheritanceGroupId` in items. |
| `inheritedProperties` | `string[]` | An array of property names (from the Item Configuration list) that should be inherited.     |

**Supported Inheritable Properties:**

- `isDownloadable`
- `isVisibleOnInit`
- `isHidden`
- `disableVisibilityToggle`
- `isOpenOnInit`
- `showFields`
- `visibilityDependencyIds`
- `visibilityGroupId`
- `customConverterId`
- `inheritanceGroupId`

**Example:**

```json
{
	"id": "group:main",
	"inheritedProperties": ["visibilityGroupId", "inheritanceGroupId"]
}
```

### 4. Fields to Hide (`fieldsToHide`)

An array of strings representing field names that should be globally hidden from the treeview across all layers. Case-insensitive.

**Example:**

```json
"fieldsToHide": [
  "objectid",
  "shape__area",
  "shape__length",
  "globalid"
]
```
