lines = open("js/pages/home.js", "r", encoding="utf-8").readlines()
lines[257] = "      { label: '\u5173\u95ed', class: 'primary', onclick: 'Home._dismissAdvanceModal()' }\n"
open("js/pages/home.js", "w", encoding="utf-8").writelines(lines)
print("Done")
