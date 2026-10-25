(function () {
  "use strict";
  const search = document.getElementById("simulatorSearch");
  const filters = [...document.querySelectorAll(".marketplace-filter")];
  const cards = [...document.querySelectorAll(".marketplace-card")];
  const empty = document.getElementById("marketplaceEmpty");
  const count = document.getElementById("marketplaceCount");
  let active = "todos";
  const normalize = (text) =>
    String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
  function update() {
    const query = normalize(search.value.trim());
    let visible = 0;
    for (const card of cards) {
      card.hidden = !(
        (active === "todos" || card.dataset.category === active) &&
        normalize(card.dataset.title).includes(query)
      );
      if (!card.hidden) visible++;
    }
    empty.hidden = visible > 0;
    count.textContent = `${visible} ${visible === 1 ? "simulador disponible" : "simuladores disponibles"}`;
  }
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      active = button.dataset.filter;
      filters.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      update();
    }),
  );
  search.addEventListener("input", update);
  update();
})();
