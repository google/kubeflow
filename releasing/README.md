# Releasing

This folder contains scripts and instructions for releasing images and manifests
for the components of this repository.

## Steps for releasing

1. Create a new release branch:
    ```sh
    VERSION="v1.3.0-rc.0"
    RELEASE_BRANCH="v1.3-branch"
    git checkout -b $RELEASE_BRANCH origin/master
    ```
2. Edit files under manifests (e.g., Deployments) to the release image tag:
    ```sh
    TAG=$VERSION
    releasing/update-manifests-images $TAG
    ```
3. Bump version in `VERSION` file:
    ```sh
    echo "$VERSION" > VERSION
    ```
4. Commit changes to the release branch:
    ```sh
    git commit -s -a -m "Release $VERSION"
    ```
5. PR merged (after CI validates and builds all images for that commit).
6. CI job (postsubmit) kicks in and builds the images for $VERSION.
7. Tag commit as $VERSION.
