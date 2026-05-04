import { app, port } from "./setup";
import "./endpoints";

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
