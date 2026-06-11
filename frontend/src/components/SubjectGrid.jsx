import { subjects } from "../data.js";

export default function SubjectGrid() {
  return (
    <section className="grid-cards">
      {subjects.map((subject) => (
        <article className="card-subject" key={subject.name}>
          <div className="card-image">{subject.icon}</div>
          <div className="card-content">
            <h3>{subject.name}</h3>
            <p>{subject.desc}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
