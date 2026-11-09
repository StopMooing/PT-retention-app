// Recipe photos (matched from Pexels by the recipe-photos edge function). A recipe with no
// photo shows nothing here, so rows and sheets never show an empty box.

// A small square photo for list rows.
export function RecipeThumb({ recipe, size = 56 }) {
  if (!recipe?.photo_thumb_url) return null
  return (
    <img
      src={recipe.photo_thumb_url}
      alt=""
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size }}
      className="rounded-[12px] object-cover bg-surface-2 shrink-0"
    />
  )
}

// The big photo at the top of a recipe, with the photographer's credit.
export function RecipeHero({ recipe }) {
  if (!recipe?.photo_url) return null
  return (
    <figure>
      <img
        src={recipe.photo_url}
        alt={recipe.name}
        decoding="async"
        className="w-full aspect-[16/10] rounded-[16px] object-cover bg-surface-2"
      />
      {recipe.photo_credit && (
        <figcaption className="text-[12px] text-faint mt-1 px-1">
          Photo:{' '}
          <a href={recipe.photo_credit_url} target="_blank" rel="noreferrer" className="underline">{recipe.photo_credit}</a>
          {' '}on Pexels
        </figcaption>
      )}
    </figure>
  )
}
