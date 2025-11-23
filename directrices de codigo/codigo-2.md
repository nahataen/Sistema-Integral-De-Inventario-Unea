Create a function within the `ingresar_img_thumnnails.rs` file that adds an extra column to your existing secure table (`tablasegura`) without modifying any other parts of the file or application.

This function should:

- Allow choosing the type of the new column: either text or an image-upload column.
- If the image-upload type is selected, the column must handle image uploads and ensure the images are stored properly in the database.
- Always add the new column as the last column in the table.
- Make sure adding this new column does not affect or alter the functionality or structure of the existing columns or other parts of the system.

# Steps

1. Implement a dedicated function in `ingresar_img_thumnnails.rs` that receives parameters to define the new column's type (text or image).
2. Inside the function, handle the database schema update securely to add the new column at the end.
3. For image columns, implement the logic to accept image uploads and save them to the database.
4. Ensure the function does not modify existing code outside its scope.

# Output Format

Provide the Rust function code for `ingresar_img_thumnnails.rs` that fulfills these requirements, with appropriate comments explaining key parts of the implementation.