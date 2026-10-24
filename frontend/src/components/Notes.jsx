const NOTES = [
  {
    title: 'Children',
    text: 'We love little ones, but this celebration is planned for adults. Thank you for understanding.',
  },
  {
    title: 'Plus Ones',
    text: 'Space is limited, so we can welcome only the guests named on each invitation.',
  },
  {
    title: 'Invitation',
    text: 'Invitations are personal to the guests listed and cannot be transferred.',
  },
  {
    title: 'Attire',
    text: 'We ask that you dress in formal attire for the ceremony and reception.',
  },
]

export default function Notes() {
  return (
    <section className="notes">
      <div className="notes__content">
        <h2 className="notes__heading">Finer Details</h2>
        <p className="notes__subtitle">A few notes about our wedding</p>
        <p className="notes__intro">
          We can’t wait to celebrate with you. To help make the day comfortable
          and memorable for everyone, please keep these wishes in mind.
        </p>

        <div className="notes__list">
          {NOTES.map(({ title, text }) => (
            <div className="notes__item" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <p className="notes__thanks">
          Thank you for understanding and for being part of our celebration.
          Having you with us means so much.
        </p>
      </div>
    </section>
  )
}
