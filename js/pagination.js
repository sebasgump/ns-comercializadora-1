const PRODUCTS_PER_PAGE = 36
const productContainer = document.getElementById("product-container") // contains only the currently shown products
const productStore = Object.freeze(Array.from(productContainer.children)) // always contains all initial products
const paginationList = document.getElementById("pagination-list")
const categoryList = document.getElementById("category-list")
const subcategoryList = document.getElementById("subcategory-list")
const brandList = document.getElementById("brand-list")

/**
 * calculates the amount of pages required to show all currently active products
 * taking into account the value of PRODUCTS_PER_PAGE,
 * then creates the respective amount of page buttons and appends them to the pagination list in the DOM
 */
function paginate() {
  paginationList.innerHTML = "" // clear pagination buttons

  const productsArray = Array.from(productContainer.children) // get currently active products

  // if no currently active products available, create a placeholder text and abort pagination
  if (!productsArray.length) {
    const noProductsPlaceholder = document.createElement("p")
    noProductsPlaceholder.appendChild(
      document.createTextNode("No se encontraron productos disponibles.")
    )
    paginationList.appendChild(noProductsPlaceholder)
    return
  }

  const pageAmount = Math.ceil(productsArray.length / PRODUCTS_PER_PAGE) // calculate required amount of pages

  let currentPage // stores the currently active page for the next page button

  /**
   * fills the DOM product container with products for the given page number
   * @param {number} pageNumber the page to open
   * @returns curried function to be run by onclick event handler
   */
  function openPage(pageNumber) {
    return function () {
      currentPage = pageNumber

      const productsForCurrentPage = productsArray.slice(
        PRODUCTS_PER_PAGE * (currentPage - 1),
        PRODUCTS_PER_PAGE * (currentPage - 1) + PRODUCTS_PER_PAGE
      ) // get products for current page from the active products

      productContainer.innerHTML = "" // clear product container

      for (const product of productsForCurrentPage)
        productContainer.appendChild(product) // add products to DOM container

      // remove current-page class from previous page button and add it to current page button
      paginationList
        .querySelector(".current-page")
        ?.classList.remove("current-page")
      paginationList
        .querySelector(`:nth-child(${currentPage})`)
        .setAttribute("class", "current-page")
    }
  }

  // create all necessary page number buttons and append to DOM
  for (let i = 1; i <= pageAmount; i++) {
    const pageButton = document.createElement("span")
    const pageNumber = document.createTextNode(i.toString())
    pageButton.appendChild(pageNumber)
    pageButton.addEventListener("click", openPage(i))
    paginationList.appendChild(pageButton)
  }

  // create next and last page buttons
  const nextPageButton = document.createElement("span")
  const lastPageButton = document.createElement("span")

  nextPageButton.appendChild(document.createTextNode("››"))
  nextPageButton.setAttribute("class", "icon")
  nextPageButton.addEventListener("click", function () {
    currentPage < pageAmount && openPage(currentPage + 1)()
  })

  lastPageButton.appendChild(document.createTextNode("Último »"))
  lastPageButton.setAttribute("class", "last")
  lastPageButton.addEventListener("click", openPage(pageAmount))

  paginationList.appendChild(nextPageButton)
  paginationList.appendChild(lastPageButton)

  openPage(1)() // open page 1 at start by default
}

// store all unique categories, subcategories and brands
const categoryNames = new Set()
const subcategoryNames = new Set()
const brandNames = new Set()

// variable arrays to contain the currently active filters
const activeFilters = {
  categories: [],
  subcategories: [],
  brands: [],
}

// get all categories, subcategories and brands from the product data attributes and add them to their respective sets
for (const {
  dataset: { categories, subcategories, brands },
} of productStore) {
  categories
    ?.split(/,/)
    .map((cn) => cn.trim())
    .filter((cn) => cn)
    .map(categoryNames.add, categoryNames)
  subcategories
    ?.split(/,/)
    .map((sn) => sn.trim())
    .filter((sn) => sn)
    .map(subcategoryNames.add, subcategoryNames)
  brands
    ?.split(/,/)
    .map((bn) => bn.trim())
    .filter((bn) => bn)
    .map(brandNames.add, brandNames)
}

/**
 * gets all products matching the currently active filter checkboxes from the store
 * and adds them to the DOM container, then calls pagination
 *
 * filter logic:
 * - if no checkboxes are active, all products are shown
 * - if one or more checkboxes of a given type (categories, subcategories, brands) are active,
 *    all products matching **any** of the filters within that type are shown
 * - if checkboxes across different filter types are active,
 *    only products matching at least one within **all** different types are shown
 * @param {Event} param0 change event emitted by the filter checkbox
 */
function filter({ target }) {
  const [filterType, filterValue] = target.name.split(/-/)

  target.checked
    ? activeFilters[filterType].push(filterValue)
    : activeFilters[filterType].splice(
        activeFilters[filterType].indexOf(filterValue),
        1
      )

  productContainer.innerHTML = ""

  if (
    !(
      activeFilters.categories.length +
      activeFilters.subcategories.length +
      activeFilters.brands.length
    )
  )
    for (const product of productStore) productContainer.appendChild(product)
  else {
    const matchingProducts = productStore.filter(
      ({ dataset }) =>
        (!activeFilters.categories.length ||
          (!(typeof dataset.categories === "undefined") &&
            dataset.categories
              .split(/,/)
              .map((cn) => cn.trim())
              .some((category) =>
                activeFilters.categories.includes(category)
              ))) &&
        (!activeFilters.subcategories.length ||
          (!(typeof dataset.subcategories === "undefined") &&
            dataset.subcategories
              .split(/,/)
              .map((sn) => sn.trim())
              .some((subcategory) =>
                activeFilters.subcategories.includes(subcategory)
              ))) &&
        (!activeFilters.brands.length ||
          (!(typeof dataset.brands === "undefined") &&
            dataset.brands
              .split(/,/)
              .map((bn) => bn.trim())
              .some((brand) => activeFilters.brands.includes(brand))))
    )
    for (const matchingProduct of matchingProducts) {
      productContainer.appendChild(matchingProduct)
    }
  }
  paginate()
}

function createFilterCheckbox(type, name, checked = false) {
  const listItem = document.createElement("li")
  listItem.dataset[type] = name
  const input = document.createElement("input")
  input.setAttribute("type", "checkbox")
  input.setAttribute("name", `${type}-${name}`)
  input.setAttribute("id", input.name)
  input.addEventListener("click", filter)
  checked && input.click()
  const label = document.createElement("label")
  label.setAttribute("for", input.name)
  const span = document.createElement("span")
  span.appendChild(document.createTextNode(name))
  const small = document.createElement("small")
  small.appendChild(
    document.createTextNode(
      `(${
        productStore.filter(({ dataset }) =>
          dataset[type]
            ?.split(/,/)
            .map((name) => name.trim())
            .includes(name)
        ).length
      })`
    )
  )
  label.appendChild(span)
  label.appendChild(small)
  listItem.appendChild(input)
  listItem.appendChild(label)
  return listItem
}

const preselectFilter = new URLSearchParams(window.location.search)
  .get("filter")
  ?.toLowerCase()
let preselectFilterIsValid = false

for (const categoryName of [...categoryNames].sort()) {
  preselectFilterIsValid =
    preselectFilterIsValid || preselectFilter === categoryName.toLowerCase()
  categoryList.appendChild(
    createFilterCheckbox(
      "categories",
      categoryName,
      preselectFilter === categoryName.toLowerCase()
    )
  )
}

for (const subcategoryName of [...subcategoryNames].sort()) {
  subcategoryList.appendChild(
    createFilterCheckbox("subcategories", subcategoryName)
  )
}

for (const brandName of [...brandNames].sort()) {
  brandList.appendChild(createFilterCheckbox("brands", brandName))
}

preselectFilterIsValid || paginate()
