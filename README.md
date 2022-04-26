# Cura Plugin Packager Action

A github workflow action that creates .curapackage files from Cura plugin source repositories.
The action parses plugin.info to detect the compatible major Cura SDK versions and creates a .curapackage file for
each SDK version.

## Inputs

| Parameter               | Description                                                | Default  |
| ----------------------- | ---------------------------------------------------------- | -------- |
| `source_folder`         | Path to the checked out source of the Cura plugin.         | ``       |
| `plugin_id`             | Plugin id, in Cura, can be used to override package.json   | ``       |
| `package_info_path`     | Path to a package.json                                     | ``       |

If no `package_info_path` is specified a template `package.json` file is used. If the referenced `package.json`
does not include a `package_id` field, the `plugin_id` argument must be specified. If both the `package.json` file
contains a `package_id` and the `plugin_id` argument is specified, then the `plugin_id` argument is used.

## Outputs

The following output values can be accessed via `${{ steps.<step-id>.outputs.<output-name> }}`:

| Name                    | Description                                            | Type          |
| ----------------------- | ------------------------------------------------------ | ------------- |
| `packages`              | List of created .curapackage files                     | array<string> |


## Example

The workflow below, which is triggered when a new tag starting with the letter `v` is pushed, checks out the repository
into a folder named `build` using `actions/checkout`, creates packages while referencing the `package.json` file
included in the repository, and uses `marvinpinto/action-automatic-releases` to create a release with the .curapackage
files attached.

```yaml
name: "Cura-plugin release"

on:
  push:
    tags:
      - "v*"

jobs:
  create-curapackages:
    name: "Tagged Release"
    runs-on: "ubuntu-latest"

    steps:
      - uses: actions/checkout@v3
        with:
          path: "build"
          submodules: "recursive"
      - uses: fieldOfView/cura-plugin-packager-action@main
        with:
          source_folder: "build"
          package_info_path: "build/.github/workflows/package.json"
      - uses: marvinpinto/action-automatic-releases@latest
        with:
          repo_token: "${{ secrets.GITHUB_TOKEN }}"
          prerelease: false
          files: |
            *.curapackage
```
