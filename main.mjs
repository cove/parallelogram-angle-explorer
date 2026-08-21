// The query is a cache buster: a browser holding an older app.mjs from a
// previous visit would throw on a page that carries only some diagrams.
import { initializeApp } from "./app.mjs?v=13";

initializeApp(document, window);
