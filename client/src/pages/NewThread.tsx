import { Button, Input, TextArea } from "@react95/core";
import useNewThreadForm from "../hooks/useNewThreadForm.ts";

export default function NewThread() {
  const { title, contents, err, handleInputChange, handleSubmit } = useNewThreadForm();

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Create new post</h2>
      <div className="tightSection">
        <div className="smallAndGray">Title</div>
        <Input
          className="notTooWide widefill"
          value={title}
          onChange={(e) => handleInputChange(e, "title")}
        />
      </div>
      <div className="tightSection">
        <div className="smallAndGray">Post contents</div>
        <TextArea
          className="notTooWide"
          style={{ minHeight: "10rem" }}
          value={contents}
          onChange={(e) => handleInputChange(e, "contents")}
        ></TextArea>
      </div>
      {err && <p className="error-message">{err}</p>}
      <div>
        <Button className="primary">Create</Button>
      </div>
    </form>
  );
}
