import React, { useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import Tesseract from 'tesseract.js'

const Add = () => {

  const url = "http://localhost:4000"

  const [image, setImage] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)

  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad"
  })

  const [dietaryTags, setDietaryTags] = useState([])
  const [allergens, setAllergens] = useState([])

  const dietaryOptions = ["Veg", "Vegan", "Jain", "Gluten-Free"]
  const allergenOptions = ["Nuts", "Dairy", "Gluten", "Soy"]

  // INPUT CHANGE HANDLER
  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  // IMAGE HANDLER
  const imageHandler = (e) => {
    setImage(e.target.files[0])
  }

  const handleCheckboxChange = (e, state, setState) => {
    const { value, checked } = e.target
    if (checked) {
      setState([...state, value])
    } else {
      setState(state.filter(item => item !== value))
    }
  }

  // OCR HANDLER
  const handleOCRUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setOcrLoading(true)
    toast.info("Analyzing menu image...", { autoClose: 2000 })
    
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      })
      
      const text = result.data.text
      console.log("OCR Result: ", text)
      
      // Basic parsing logic: Look for lines with $ or ₹, or assume first line is title, next is desc, last is price
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      
      if (lines.length >= 2) {
        let name = lines[0]
        let price = "200" // default fallback
        
        // Find a line with a number for price
        const priceLine = lines.find(l => /\d+/.test(l) && (l.includes('₹') || l.includes('$') || l.includes('Rs')))
        if (priceLine) {
          const match = priceLine.match(/\d+/)
          if (match) price = match[0]
        }

        // Generate a description from remaining lines
        const description = lines.slice(1, 3).join(' ') || "Delicious food item."

        setData(prev => ({
          ...prev,
          name: name,
          description: description,
          price: price
        }))
        
        toast.success("Successfully parsed menu details!")
      } else {
        toast.warning("Could not clearly read the menu structure.")
      }
      
    } catch (error) {
      console.error(error)
      toast.error("Failed to read image.")
    } finally {
      setOcrLoading(false)
    }
  }

  // SUBMIT HANDLER
  const onSubmitHandler = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("description", data.description)
    formData.append("price", Number(data.price))
    formData.append("category", data.category)
    formData.append("dietaryPreference", data.dietaryPreference || "Unspecified")
    formData.append("dietaryTags", JSON.stringify(dietaryTags))
    formData.append("allergens", JSON.stringify(allergens))
    formData.append("image", image)

    try {
      const token = localStorage.getItem("admin-token")
      const response = await axios.post(
        `${url}/api/food/add`,
        formData,
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success(response.data.message || "Food Added Successfully")

        setData({
          name: "",
          description: "",
          price: "",
          category: "Salad"
        })
        setImage(false)
        setDietaryTags([])
        setAllergens([])
      } else {
        toast.error(response.data.message || "Error adding food")
      }

    } catch (error) {
      console.log(error)
      toast.error("Server Error")
    }
  }

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>

        {/* MENU OCR BUTTON */}
        <div className="ocr-section" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>📄 Smart Menu Import (OCR)</p>
          <input 
            type="file" 
            accept="image/*" 
            id="ocr-upload" 
            hidden 
            onChange={handleOCRUpload} 
          />
          <label 
            htmlFor="ocr-upload" 
            style={{ display: 'inline-block', padding: '8px 16px', background: '#0284c7', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
          >
            {ocrLoading ? "Scanning Menu..." : "Scan Menu Image"}
          </label>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Upload a photo of your menu and we'll try to auto-fill the details below!
          </p>
        </div>

        {/* IMAGE UPLOAD */}
        <div className="add-img-upload flex-col">
          <p>Upload Product Image</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            type="file"
            id="image"
            hidden
            required
            onChange={imageHandler}
          />
        </div>

        {/* PRODUCT NAME */}
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            type="text"
            name="name"
            value={data.name}
            onChange={onChangeHandler}
            placeholder="Type here"
            required
          />
        </div>

        {/* PRODUCT DESCRIPTION */}
        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea
            name="description"
            value={data.description}
            onChange={onChangeHandler}
            rows="6"
            placeholder="Write content here"
            required
          ></textarea>
        </div>

        {/* CATEGORY & PRICE */}
        <div className="add-category-price">

          <div className="add-category flex-col">
            <p>Product category</p>
            <select
              name="category"
              value={data.category}
              onChange={onChangeHandler}
            >
              <option value="Salad">Salad</option>
              <option value="Rolls">Rolls</option>
              <option value="Deserts">Deserts</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Cake">Cake</option>
              <option value="Pure Veg">Pure Veg</option>
              <option value="Pasta">Pasta</option>
              <option value="Noodles">Noodles</option>
            </select>
          </div>

          <div className="add-category flex-col">
            <p>Dietary Preference</p>
            <select
              name="dietaryPreference"
              value={data.dietaryPreference || "Unspecified"}
              onChange={onChangeHandler}
            >
              <option value="Unspecified">Unspecified</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Vegan">Vegan</option>
            </select>
          </div>

          <div className="add-price flex-col">
            <p>Product price</p>
            <input
              type="number"
              name="price"
              value={data.price}
              onChange={onChangeHandler}
              placeholder="$20"
              required
            />
          </div>

        </div>

        {/* DIETARY TAGS & ALLERGENS */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', marginBottom: '20px' }}>
          <div className="flex-col" style={{ flex: 1 }}>
            <p style={{ fontWeight: 'bold' }}>Dietary Tags</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
              {dietaryOptions.map(tag => (
                <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input 
                    type="checkbox" 
                    value={tag} 
                    checked={dietaryTags.includes(tag)}
                    onChange={(e) => handleCheckboxChange(e, dietaryTags, setDietaryTags)} 
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <div className="flex-col" style={{ flex: 1 }}>
            <p style={{ fontWeight: 'bold', color: '#b91c1c' }}>Allergen Warnings</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
              {allergenOptions.map(allergen => (
                <label key={allergen} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#b91c1c' }}>
                  <input 
                    type="checkbox" 
                    value={allergen} 
                    checked={allergens.includes(allergen)}
                    onChange={(e) => handleCheckboxChange(e, allergens, setAllergens)} 
                  />
                  {allergen}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button type="submit" className="add-btn">
          ADD
        </button>

      </form>
    </div>
  )
}

export default Add

