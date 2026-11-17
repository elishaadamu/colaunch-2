import { useState, useEffect } from 'react'
import { Download, Loader2, Image as ImageIcon } from 'lucide-react'
import { generateProductImage, buildProductScreenPrompt } from '../../services/ai'

export default function ProductMockupCanvas({ project, onSaveMockupImage, onShowNotification }) {
  const [style, setStyle] = useState('screen') // 'screen' | 'desk'
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
  const brandColor = project?.brandColor || project?.brand_color || '#c81e3c'

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
    <div className="space-y-4 rounded-xl bg-[#101419] border border-[#252B32] p-5 text-left text-[#F5F3EA]">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Style Switch */}
        <div className="flex items-center rounded-lg bg-[#080A0C] border border-[#252B32] p-1">
          <button
            type="button"
            onClick={() => setStyle('screen')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              style === 'screen'
                ? 'bg-[#171B24] text-[#F5F3EA] border border-[#252B32]'
                : 'text-[#969DA6] hover:text-[#F5F3EA]'
            }`}
          >
            Product screen
          </button>
          <button
            type="button"
            onClick={() => setStyle('desk')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              style === 'desk'
                ? 'bg-[#171B24] text-[#F5F3EA] border border-[#252B32]'
                : 'text-[#969DA6] hover:text-[#F5F3EA]'
            }`}
          >
            Laptop and phone
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {imageUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171B24] border border-[#252B32] text-xs font-medium text-[#F5F3EA] hover:border-[#3a4350] transition-colors cursor-pointer"
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
        <label htmlFor="mockup-direction" className="block text-xs font-medium text-[#969DA6] mb-1.5">
          Creator direction (optional)
        </label>
        <input
          id="mockup-direction"
          type="text"
          maxLength={300}
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          placeholder="e.g. Focus on interactive workflow steps, minimalist navigation"
          className="w-full px-3 py-2 rounded-lg bg-[#080A0C] border border-[#252B32] text-xs text-[#F5F3EA] placeholder-[#686F78] outline-none focus:border-[#c81e3c] transition-colors"
        />
      </div>

      {/* Error Message */}
      {errorText && (
        <div className="p-3 rounded-lg bg-[#171B24] border border-[#c81e3c]/40 text-xs text-[#ff8fa3]">
          {errorText}
        </div>
      )}

      {/* 16:9 Image Area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#080A0C] border border-[#252B32] flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName || 'Planned product mockup'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-[#686F78]" />
            <p className="text-xs font-medium text-[#969DA6]">
              No product image generated yet.
            </p>
            <p className="text-[11px] text-[#686F78]">
              Choose a style and click generate image to illustrate the product.
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 bg-[#080A0C]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#c81e3c]" />
            <p className="text-xs font-medium text-[#F5F3EA]">Generating product illustration...</p>
            <p className="text-[11px] text-[#969DA6]">This usually takes 10 to 15 seconds with DALL-E 3.</p>
          </div>
        )}
      </div>

      {/* Note under image */}
      <p className="text-xs text-[#969DA6] leading-relaxed">
        AI-generated illustration of the planned product. Labels can come out slightly off, so check the words before you launch.
      </p>
    </div>
  )
}
