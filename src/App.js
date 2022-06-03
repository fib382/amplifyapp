// import logo from './logo.svg';
// import './App.css';

// import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
// import '@aws-amplify/ui-react/styles.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

import React, { startTransition, useEffect, useState } from "react";
import "./App.css";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { API, Storage } from "aws-amplify";
import { listNotes } from "./graphql/queries";
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation} from './graphql/mutations';

const initialFormState = { name: "", description: "" };

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const image = await Storage.get(note.image);
          note.image = image;
        }
        return note;
      })
    );
    setNotes(apiData.data.listNotes.items);
  }

  async function onChange(e) {
    if (!e.target.file[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({
      query: createNoteMutation,
      variables: { input: formData },
    });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <input
        className="input-group"
        onChange={(e) =>
          setFormData({
            ...formData,
            name: e.target.value,
          })
        }
        placeholder="Note description"
        value={formData.name}
      />
      <input
        className="input-group"
        onChange={(e) =>
          setFormData({
            ...formData,
            description: e.target.value,
          })
        }
        placeholder="Note description"
        value={formData.description}
      />
      <button className="button" onClick={createNote}>
        Create Note
      </button>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>name</th>
            <th>description</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => (
            <tr key={note.id || note.name}>
              <td>{note.name}</td>
              <td>{note.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default withAuthenticator(App);
