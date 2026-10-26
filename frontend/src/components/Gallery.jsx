export default function Gallery() {
  return (
    <section className="gallery">
      <div className="story-card">
        <img
          className="story-card__photo"
          src="/images/our-story.webp"
          width="1200"
          height="670"
          loading="lazy"
          decoding="async"
          alt="Our Story: We first met in college over a simple group assignment, not knowing it would become the beginning of forever. What started as classmates helping each other turned into friendship, laughter, and a love we never expected. From a birthday dinner that showed me she was the one, to a surprise proposal where I put the ring on the wrong hand — it has been perfectly, beautifully us."
        />
      </div>
    </section>
  )
}
