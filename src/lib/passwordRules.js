// Eisen voor een sterk wachtwoord. Houd deze gelijk aan de instellingen in Supabase
// (Authentication → Providers → Email: minimale lengte en verplichte tekens), want alleen daar
// worden ze ook echt afgedwongen; deze controle in de browser is voor directe feedback.
export const PASSWORD_RULES = [
  { label: "Minstens 8 tekens", test: (pw) => pw.length >= 8 },
  { label: "Een hoofdletter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Een kleine letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Een cijfer", test: (pw) => /[0-9]/.test(pw) },
  { label: "Een speciaal teken (!?@#)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function isStrongPassword(pw) {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}

// Zet onder een wachtwoordveld een lijst met de eisen die meekleurt tijdens het typen.
// De lijst verschijnt pas bij het typen en verdwijnt weer als alles klopt, zodat het formulier kort blijft.
// Zolang het wachtwoord niet sterk genoeg is, is het veld ongeldig en blokkeert de browser het formulier.
export function attachPasswordRules(input) {
  const list = document.createElement("ul");
  list.className = "password-rules";
  list.id = `${input.id}-rules`;
  input.setAttribute("aria-describedby", list.id);

  const items = PASSWORD_RULES.map((rule) => {
    const item = document.createElement("li");
    item.textContent = rule.label;
    list.append(item);
    return { rule, item };
  });

  const update = () => {
    const pw = input.value;
    const strong = isStrongPassword(pw);
    for (const { rule, item } of items) item.classList.toggle("is-met", rule.test(pw));
    list.hidden = pw === "" || strong;
    input.setCustomValidity(strong ? "" : "Je wachtwoord voldoet nog niet aan alle eisen.");
  };

  input.addEventListener("input", update);
  input.after(list);
  update();
}
