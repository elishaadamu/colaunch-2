import { useState, useEffect } from 'react'
import { Download, Loader2, Image as ImageIcon } from 'lucide-react'
import { generateProductImage, buildProductScreenPrompt } from '../../services/ai'
import { resolveProjectLanding } from '../../utils/projectLanding'

export default function ProductMockupCanvas({ project, onSaveMockupImage, onShowNotification }) {
  const style = 'screen' // product dashboard screen only
  const [direction, setDirection] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState(() => project?.mockupImage || project?.mockup_image || project?.meta?.mockup_image || null)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    const existing = project?.mockupImage || project?.mockup_image || project?.meta?.mockup_image || null
    if (existing && !imageUrl) {
      setImageUrl(existing)
    }
  }, [project])

  const productName = project?.productName || project?.name || project?.selectedConcept?.name || ''
  // Same accent as the approved Step 5 landing page (crimson / emerald / ember)
  const brandColor = resolveProjectLanding(project || {}).brandColor || project?.brandColor || '#c81e3c'

  const handleGenerate = async () => {
    if (!productName || isGenerating) return
    setIsGenerating(true)
    setErrorText('')

    try {
      const prompt = buildProductScreenPrompt(project, {
        brandColor,
        direction,
        style,
      })

      const url = await generateProductImage(project, {
        prompt,
        brandColor,
        size: '1792x1024',
        quality: 'hd',
      })

      if (url) {
        setImageUrl(url)
        if (onSaveMockupImage) {
          onSaveMockupImage(url)
        }
        if (onShowNotification) {
          onShowNotification('Product image generated and saved')
        }
      } else {
        throw new Error('No image was returned. Please try again.')
      }
    } catch (err) {
      const msg = err?.message || String(err)
      if (msg.includes('NO_OPENAI_KEY') || msg.toLowerCase().includes('enter an active openai api key')) {
        setErrorText('Missing OpenAI API key. Please add an OpenAI key in Settings to generate images.')
      } else if (msg.includes('401') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('unauthorized')) {
        setErrorText('OpenAI API key rejected or expired. Please check your key in Settings.')
      } else {
        setErrorText(msg || 'Failed to generate image. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `${(productName || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-mockup.png`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      className="keep-dark product-mockup-canvas space-y-4 rounded-xl p-5 text-left"
      style={{
        backgroundColor: '#101419',
        borderColor: '#252B32',
        borderWidth: '1px',
        borderStyle: 'solid',
        color: '#F5F3EA'
      }}
    >
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Style Switch */}
        <p className="m-0 text-xs font-medium" style={{ color: '#A1A1AA' }}>Product dashboard screen</p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {imageUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer hover:border-[#3a4350]"
              style={{
                backgroundColor: '#171B24',
                borderColor: '#252B32',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: '#F5F3EA'
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !productName}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: '#c81e3c' }}
          >
            {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{imageUrl ? 'Generate again' : 'Generate image'}</span>
          </button>
        </div>
      </div>

      {/* Optional Creator Direction */}
      <div>
        <label htmlFor="mockup-direction" className="block text-xs font-medium mb-1.5" style={{ color: '#969DA6' }}>
          Creator direction (optional)
        </label>
        <input
          id="mockup-direction"
          type="text"
          maxLength={300}
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          placeholder="e.g. Focus on interactive workflow steps, minimalist navigation"
          className="w-full px-3 py-2 rounded-lg text-xs placeholder-[#686F78] outline-none focus:border-[#c81e3c] transition-colors"
          style={{
            backgroundColor: '#080A0C',
            borderColor: '#252B32',
            borderWidth: '1px',
            borderStyle: 'solid',
            color: '#F5F3EA'
          }}
        />
      </div>

      {/* Error Message */}
      {errorText && (
        <div
          className="p-3 rounded-lg text-xs"
          style={{
            backgroundColor: '#171B24',
            borderColor: 'rgba(200, 30, 60, 0.4)',
            borderWidth: '1px',
            borderStyle: 'solid',
            color: '#ff8fa3'
          }}
        >
          {errorText}
        </div>
      )}

      {/* 16:9 Image Area */}
      <div
        className="relative aspect-[16/9] w-full overflow-hidden rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: '#080A0C',
          borderColor: '#252B32',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName || 'Planned product mockup'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto" style={{ color: '#686F78' }} />
            <p className="text-xs font-medium" style={{ color: '#969DA6' }}>
              No product image generated yet.
            </p>
            <p className="text-[11px]" style={{ color: '#686F78' }}>
              Choose a style and click generate image to illustrate the product.
            </p>
          </div>
        )}

        {isGenerating && (
          <div
            className="absolute inset-0 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 text-center"
            style={{ backgroundColor: 'rgba(8, 10, 12, 0.88)' }}
          >
            <Loader2 className="w-6 h-6 animate-spin text-[#c81e3c]" />
            <p className="text-xs font-medium" style={{ color: '#F5F3EA' }}>Generating product illustration...</p>
            <p className="text-[11px]" style={{ color: '#969DA6' }}>This usually takes 10 to 15 seconds with DALL-E 3.</p>
          </div>
        )}
      </div>

      {/* Note under image */}
      <p className="text-xs leading-relaxed" style={{ color: '#969DA6' }}>
        AI-generated illustration of the planned product. Labels can come out slightly off, so check the words before you launch.
      </p>
    </div>
  )
}
