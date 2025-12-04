-- Create campaign_emails table for storing generated emails
CREATE TABLE IF NOT EXISTS campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Email content
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft', -- draft, edited, queued, sent, failed, bounced
  edited_by_user BOOLEAN DEFAULT false,
  
  -- Sending metadata
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  complained_at TIMESTAMP,
  
  -- Tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(campaign_id, lead_id)
);

-- Index for faster queries
CREATE INDEX idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);
CREATE INDEX idx_campaign_emails_lead_id ON campaign_emails(lead_id);
CREATE INDEX idx_campaign_emails_status ON campaign_emails(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_campaign_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_emails_updated_at
  BEFORE UPDATE ON campaign_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_emails_updated_at();

-- Comments
COMMENT ON TABLE campaign_emails IS 'Stores AI-generated emails for each lead in a campaign';
COMMENT ON COLUMN campaign_emails.status IS 'Email status: draft (generated), edited (user modified), queued (ready to send), sent, failed, bounced';
COMMENT ON COLUMN campaign_emails.edited_by_user IS 'True if user manually edited the email';
