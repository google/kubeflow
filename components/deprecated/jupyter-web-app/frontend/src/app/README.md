## Notebook Manager UI Components

This directory contains the Angular Components used to build the WebApp. The `main-table` and `resource-form` are the two main pages. The Table showing the Notebooks and the form to create a new one. 

Specific implementations like `Rok` exists in the `uis` folder. The webapp serves two routes, `/` and `/new`. The components for these two routes are the `MainTableRouterComponent` and `ResourceFormRouterComponent` under the `src/app/uis/multiplexer` dir. These compoenents check the `environment` to figure out which UI component to show.