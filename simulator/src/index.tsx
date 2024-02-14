/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import ReactDOM from "react-dom";
import './main.css';
import { Simulator } from "./ui/Simulator";

const App = () => (
  <>
    <h1 className="font-bold">Liquid Staking Simulator {new Date().toLocaleDateString()}</h1>
    <Simulator />
  </>
);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
