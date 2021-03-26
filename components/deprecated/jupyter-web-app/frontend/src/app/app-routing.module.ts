import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { environment } from "../environments/environment";

import { MainTableRouterComponent } from "./uis/multiplexer/main-table-router/main-table-router.component";
import { ResourceFormRouterComponent } from "./uis/multiplexer/resource-form-router/resource-form-router.component";

const routes: Routes = [
  { path: "", component: MainTableRouterComponent },
  { path: "new", component: ResourceFormRouterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
