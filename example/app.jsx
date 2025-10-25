import "/msga/msga.css";
import "/app.css";
import { createApp } from "@/msga/msga.js";
import { Welcome } from "@/components/Welcome";

const App = () => (
    <Welcome text="Content Generation"/>
)

createApp(App);