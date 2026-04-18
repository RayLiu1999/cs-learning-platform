import React from 'react'
import './FormattedContent.css'

const FormattedContent = ({ text }) => {
  if (!text) return null

  const paragraphs = text.split('\n').filter(p => p.trim() !== '')

  return (
    <div className="formatted-content">
      {paragraphs.map((para, pIdx) => {
        const listPattern = /(\(\d\)\s?[^()]+)/g
        const listMatches = para.match(listPattern)

        if (listMatches && listMatches.length > 1) {
          const introText = para.split('(')[0]
          const lastMatch = listMatches[listMatches.length - 1]
          const outroText = para.split(lastMatch)[1]

          return (
            <div key={pIdx} className="content-paragraph">
              {introText && <p className="content-intro">{formatInline(introText)}</p>}
              <ul className="content-list">
                {listMatches.map((item, iIdx) => (
                  <li key={iIdx} className="content-list-item">
                    {formatInline(item)}
                  </li>
                ))}
              </ul>
              {outroText && outroText.trim() && <p className="content-outro">{formatInline(outroText)}</p>}
            </div>
          )
        }

        return (
          <p key={pIdx} className="content-text">
            {formatInline(para)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text) {
  const parts = text.split(/(`[^`]+`)/g)

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="inline-code">{part.slice(1, -1)}</code>
    }

    const emphasisParts = part.split(/(『[^』]+』)/g)
    return emphasisParts.map((ePart, j) => {
      if (ePart.startsWith('『') && ePart.endsWith('』')) {
        return <span key={`${i}-${j}`} className="emphasis-text">{ePart}</span>
      }
      return ePart
    })
  })
}

export default FormattedContent
