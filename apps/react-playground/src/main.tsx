import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Test importing CSS/SCSS/LESS files using wildcard exports
import "@uipath/apollo-react/core/tokens/css/variables.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
