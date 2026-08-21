// The query is a cache buster. Every module carries the same number and it
// only ever goes up: reusing one for changed content leaves browsers pairing
// a fresh module with a stale one, which throws instead of drawing.
import { initializeApp } from "./app.mjs?v=31";

initializeApp(document, window);
